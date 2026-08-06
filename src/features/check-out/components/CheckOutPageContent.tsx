"use client";

import { useMemo, useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";

import { CheckOutModal } from "@/components/check-out/CheckOutModal";
import { EarlyCheckOutModal } from "@/components/check-out/EarlyCheckOutModal";
import { LateCheckOutModal } from "@/components/check-out/LateCheckOutModal";
import { DepartureClassificationBadge } from "@/components/reservations/DepartureClassificationBadge";
import { OverstayFinancialBadge } from "@/components/reservations/OverstayFinancialBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import { getCurrentTimeString } from "@/lib/dates/time";
import {
  partitionDepartureQueues,
  resolveDepartureClassification,
} from "@/lib/reservations/departure-classification";
import { resolveOverstayStatus } from "@/lib/reservations/overstay-status";
import {
  approveOverstayChargeAction,
  prepareOverstayCheckoutAction,
  rejectOverstayChargeAction,
  waiveOverstayChargeAction,
} from "@/features/check-out/actions";
import type { CheckOutPageStats } from "@/services/reservation.service";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import type { CheckoutPolicy } from "@/types/late-checkout";
import type { OverstayCharge } from "@/types/overstay";
import type { OverstayCheckoutValidation } from "@/types/overstay-checkout";
import type { Reservation } from "@/types/reservation";
import {
  AlertTriangle,
  CalendarX,
  Clock,
  LogOut as LogOutIcon,
  Sparkles,
} from "lucide-react";

type CheckOutPageContentProps = {
  checkedInReservations: Reservation[];
  stats: CheckOutPageStats;
  access: CheckOutAccess;
  today: string;
  checkoutPolicy: CheckoutPolicy;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  canOverrideVat: boolean;
  canRecordPayment: boolean;
  folioBalances: Record<string, number>;
  folioSettlements: Record<string, AuthoritativeSettlement>;
  overstayByReservation?: Record<string, OverstayCharge>;
};

function DepartureSection({
  title,
  classification,
  reservations,
  access,
  today,
  checkoutPolicy,
  currentTime,
  folioBalances,
  overstayByReservation,
  onCheckOut,
  onLate,
  onEarly,
  onRefresh,
}: {
  title: string;
  classification: "expected_departure" | "late_checkout" | "overstay";
  reservations: Reservation[];
  access: CheckOutAccess;
  today: string;
  checkoutPolicy: CheckoutPolicy;
  currentTime: string;
  folioBalances: Record<string, number>;
  overstayByReservation?: Record<string, OverstayCharge>;
  onCheckOut: (r: Reservation) => void;
  onLate: (id: string) => void;
  onEarly: (id: string) => void;
  onRefresh: () => void;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <DepartureClassificationBadge classification={classification} />
        </div>
        <p className="text-sm text-muted-foreground">{reservations.length}</p>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Check-In</th>
                <th className="px-4 py-3 font-semibold">Scheduled Out</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    None
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const resolved = resolveDepartureClassification({
                    status: r.status,
                    checkInDate: r.checkInDate,
                    scheduledCheckOutDate: r.checkOutDate,
                    businessDate: today,
                    currentTime,
                    policyCheckOutTime: checkoutPolicy.checkOutTime,
                  });
                  const charge = overstayByReservation?.[r.id];
                  const overstay = resolveOverstayStatus({
                    status: r.status,
                    checkInDate: r.checkInDate,
                    scheduledCheckOutDate: r.checkOutDate,
                    businessDate: today,
                    policyCheckOutTime: checkoutPolicy.checkOutTime,
                    currentTime,
                    chargeStatus: charge?.status ?? null,
                  });

                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.guestName}</td>
                      <td className="px-4 py-3 font-mono">{r.roomNumber}</td>
                      <td className="px-4 py-3">{r.checkInDate}</td>
                      <td className="px-4 py-3">{r.checkOutDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <DepartureClassificationBadge
                            classification={resolved.classification}
                            label={
                              resolved.classification === "overstay" &&
                              resolved.overstayDays > 0
                                ? `Overstay · ${resolved.overstayDays}d`
                                : undefined
                            }
                          />
                          {classification === "overstay" ? (
                            <OverstayFinancialBadge
                              status={overstay.financialStatus}
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(folioBalances[r.id] ?? r.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          {access.canProcess &&
                          resolved.primaryAction === "check_out" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCheckOut(r)}
                            >
                              <LogOut className="h-4 w-4" />
                              Check-Out
                            </Button>
                          ) : null}
                          {access.canProcess &&
                          resolved.primaryAction === "late_check_out" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onLate(r.id)}
                            >
                              Late Check-Out
                            </Button>
                          ) : null}
                          {access.canProcess &&
                          resolved.primaryAction === "overstay_check_out" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onCheckOut(r)}
                            >
                              <LogOut className="h-4 w-4" />
                              Process Overstay Check-Out
                            </Button>
                          ) : null}
                          {access.canProcess &&
                          resolved.primaryAction === "early_check_out" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEarly(r.id)}
                            >
                              Early Check-Out
                            </Button>
                          ) : null}
                          {access.canManageOverstay &&
                          charge?.status === "pending" ? (
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  startTransition(async () => {
                                    await approveOverstayChargeAction(charge.id);
                                    onRefresh();
                                  })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  startTransition(async () => {
                                    const reason =
                                      window.prompt("Waiver reason") ?? "";
                                    if (!reason.trim()) return;
                                    await waiveOverstayChargeAction(
                                      charge.id,
                                      reason
                                    );
                                    onRefresh();
                                  })
                                }
                              >
                                Waive
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  startTransition(async () => {
                                    const reason =
                                      window.prompt("Rejection reason") ?? "";
                                    if (!reason.trim()) return;
                                    await rejectOverstayChargeAction(
                                      charge.id,
                                      reason
                                    );
                                    onRefresh();
                                  })
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CheckOutPageContent({
  checkedInReservations,
  stats,
  access,
  today,
  checkoutPolicy,
  defaultTaxRate,
  defaultVatApplied,
  canOverrideVat,
  canRecordPayment,
  folioBalances,
  folioSettlements,
  overstayByReservation = {},
}: CheckOutPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [overstayValidation, setOverstayValidation] =
    useState<OverstayCheckoutValidation | null>(null);
  const [earlyReservationId, setEarlyReservationId] = useState<string | null>(null);
  const [lateReservationId, setLateReservationId] = useState<string | null>(null);
  const currentTime = getCurrentTimeString();

  function openStandardCheckout(reservation: Reservation) {
    setOverstayValidation(null);
    setSelected(reservation);
    setModalOpen(true);
  }

  function openOverstayCheckout(reservation: Reservation) {
    startTransition(async () => {
      const result = await prepareOverstayCheckoutAction(reservation.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setOverstayValidation(result.validation);
      setSelected(reservation);
      setModalOpen(true);
    });
  }

  const queues = useMemo(
    () =>
      partitionDepartureQueues(
        checkedInReservations,
        today,
        checkoutPolicy.checkOutTime,
        currentTime
      ),
    [checkedInReservations, today, checkoutPolicy.checkOutTime, currentTime]
  );

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Check-Out"
      description={`Process departures at ${siteConfig.name} · Business Date: ${today}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Expected Departures"
          value={queues.expected.length}
          icon={CalendarX}
        />
        <StatCard
          title="Late Check-Outs"
          value={queues.late.length}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Overstays"
          value={queues.overstay.length}
          icon={AlertTriangle}
          iconClassName="bg-red-500/10 text-red-600"
        />
        <StatCard
          title="Completed Check-Outs"
          value={stats.completedCheckOutsToday}
          icon={LogOutIcon}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Rooms Awaiting Cleaning"
          value={stats.roomsAwaitingCleaning}
          icon={Sparkles}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
      </div>

      <div className="space-y-8">
        <DepartureSection
          title="Expected Departures"
          classification="expected_departure"
          reservations={queues.expected}
          access={access}
          today={today}
          checkoutPolicy={checkoutPolicy}
          currentTime={currentTime}
          folioBalances={folioBalances}
          overstayByReservation={overstayByReservation}
          onCheckOut={openStandardCheckout}
          onLate={setLateReservationId}
          onEarly={setEarlyReservationId}
          onRefresh={refresh}
        />
        <DepartureSection
          title="Late Check-Outs"
          classification="late_checkout"
          reservations={queues.late}
          access={access}
          today={today}
          checkoutPolicy={checkoutPolicy}
          currentTime={currentTime}
          folioBalances={folioBalances}
          overstayByReservation={overstayByReservation}
          onCheckOut={openStandardCheckout}
          onLate={setLateReservationId}
          onEarly={setEarlyReservationId}
          onRefresh={refresh}
        />
        <DepartureSection
          title="Overstays"
          classification="overstay"
          reservations={queues.overstay}
          access={access}
          today={today}
          checkoutPolicy={checkoutPolicy}
          currentTime={currentTime}
          folioBalances={folioBalances}
          overstayByReservation={overstayByReservation}
          onCheckOut={openOverstayCheckout}
          onLate={setLateReservationId}
          onEarly={setEarlyReservationId}
          onRefresh={refresh}
        />

        {queues.other.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Other In-House</h2>
                <DepartureClassificationBadge classification="in_house" />
              </div>
              <p className="text-sm text-muted-foreground">{queues.other.length}</p>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 font-semibold">Guest</th>
                      <th className="px-4 py-3 font-semibold">Room</th>
                      <th className="px-4 py-3 font-semibold">Scheduled Out</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {queues.other.map((r) => {
                      const resolved = resolveDepartureClassification({
                        status: r.status,
                        checkInDate: r.checkInDate,
                        scheduledCheckOutDate: r.checkOutDate,
                        businessDate: today,
                        currentTime,
                        policyCheckOutTime: checkoutPolicy.checkOutTime,
                      });
                      return (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{r.guestName}</td>
                          <td className="px-4 py-3 font-mono">{r.roomNumber}</td>
                          <td className="px-4 py-3">{r.checkOutDate}</td>
                          <td className="px-4 py-3">
                            <DepartureClassificationBadge
                              classification={resolved.classification}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              {access.canProcess &&
                              resolved.primaryAction === "early_check_out" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEarlyReservationId(r.id)}
                                >
                                  Early Check-Out
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {access.canProcess && (
        <>
          <CheckOutModal
            reservation={selected}
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) setOverstayValidation(null);
            }}
            onSuccess={refresh}
            defaultTaxRate={defaultTaxRate}
            defaultVatApplied={defaultVatApplied}
            canOverrideVat={canOverrideVat}
            canRecordPayment={canRecordPayment}
            folioSettlement={
              selected ? folioSettlements[selected.id] : undefined
            }
            overstayValidation={overstayValidation}
            canManageOverstay={access.canManageOverstay}
            businessDate={today}
            onOverstayStateChange={refresh}
          />
          <EarlyCheckOutModal
            reservationId={earlyReservationId}
            open={!!earlyReservationId}
            onOpenChange={(open) => !open && setEarlyReservationId(null)}
            onSuccess={refresh}
          />
          <LateCheckOutModal
            reservationId={lateReservationId}
            open={!!lateReservationId}
            onOpenChange={(open) => !open && setLateReservationId(null)}
            onSuccess={refresh}
          />
        </>
      )}
    </PageContainer>
  );
}
