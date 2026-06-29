"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { CheckOutModal } from "@/components/check-out/CheckOutModal";
import { EarlyCheckOutModal } from "@/components/check-out/EarlyCheckOutModal";
import { LateCheckOutModal } from "@/components/check-out/LateCheckOutModal";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import { getCurrentTimeString } from "@/lib/dates/time";
import { canEarlyCheckOut } from "@/lib/reservations/early-checkout";
import { canLateCheckOut } from "@/lib/reservations/late-checkout";
import type { CheckOutPageStats } from "@/services/reservation.service";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import type { CheckoutPolicy } from "@/types/late-checkout";
import type { Reservation } from "@/types/reservation";
import {
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
};

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
}: CheckOutPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [earlyReservationId, setEarlyReservationId] = useState<string | null>(null);
  const [lateReservationId, setLateReservationId] = useState<string | null>(null);
  const currentTime = getCurrentTimeString();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Check-Out"
      description={`Process departures at ${siteConfig.name}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Departures Today"
          value={stats.departuresToday}
          icon={CalendarX}
        />
        <StatCard
          title="Pending Check-Outs"
          value={stats.pendingCheckOuts}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
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

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Check-In</th>
                <th className="px-4 py-3 font-semibold">Check-Out</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkedInReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No guests in-house for check-out
                  </td>
                </tr>
              ) : (
                checkedInReservations.map((r) => {
                  const showEarly =
                    access.canProcess &&
                    canEarlyCheckOut(r.status, r.checkInDate, r.checkOutDate, today);
                  const showLate =
                    access.canProcess &&
                    canLateCheckOut(
                      r.status,
                      r.checkOutDate,
                      today,
                      currentTime,
                      checkoutPolicy.checkOutTime
                    );

                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.guestName}</td>
                      <td className="px-4 py-3 font-mono">{r.roomNumber}</td>
                      <td className="px-4 py-3">{r.checkInDate}</td>
                      <td className="px-4 py-3">{r.checkOutDate}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(folioBalances[r.id] ?? r.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          {access.canProcess && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelected(r);
                                setModalOpen(true);
                              }}
                            >
                              <LogOut className="h-4 w-4" />
                              Check-Out
                            </Button>
                          )}
                          {showEarly ? (
                            <div className="text-right">
                              <p className="mb-1 text-xs text-muted-foreground">
                                Guest leaving before scheduled checkout?
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEarlyReservationId(r.id)}
                              >
                                Early Check-Out
                              </Button>
                            </div>
                          ) : null}
                          {showLate ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLateReservationId(r.id)}
                            >
                              Late Check-Out
                            </Button>
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

      {access.canProcess && (
        <>
          <CheckOutModal
            reservation={selected}
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSuccess={refresh}
            defaultTaxRate={defaultTaxRate}
            defaultVatApplied={defaultVatApplied}
            canOverrideVat={canOverrideVat}
            canRecordPayment={canRecordPayment}
            folioSettlement={
              selected ? folioSettlements[selected.id] : undefined
            }
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
