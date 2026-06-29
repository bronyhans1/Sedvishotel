"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeWalkInAction,
  getWalkInAvailableRoomsAction,
} from "@/features/walk-in/actions";
import {
  buildWalkInSummaryData,
  WalkInSummaryPanel,
} from "@/features/walk-in/components/WalkInSummaryPanel";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import type { WalkInAccess } from "@/lib/auth/walk-in-access.types";
import { getTodayDateString } from "@/lib/dates/today";
import { buildPaymentSettlement } from "@/lib/payments/payment-settlement";
import { roundCurrency } from "@/lib/payments/currency";
import { PaymentChargeSummary } from "@/components/payments/PaymentChargeSummary";
import { PaymentTaxSection } from "@/components/payments/PaymentTaxSection";
import { formatCurrency, nightsBetween } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { ID_TYPE_OPTIONS, type IdType } from "@/types/guest";
import { PAYMENT_METHOD_OPTIONS, type TransactionPaymentMethod } from "@/types/payment";
import type { WalkInFormValues, WalkInRoomOption } from "@/types/walk-in";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STEP_COUNT = 5;

type FormState = WalkInFormValues & {
  address: string;
  occupation: string;
  emergencyContact: string;
  emergencyPhone: string;
  guestNotes: string;
  adults: number;
  children: number;
  purpose: string;
  specialRequests: string;
  discount: number;
  guestsCount: number;
  paymentNotes: string;
};

const today = getTodayDateString();

const initial: FormState = {
  fullName: "",
  phone: "",
  email: "",
  nationality: "Ghanaian",
  idType: "national_id",
  idNumber: "",
  address: "",
  occupation: "",
  emergencyContact: "",
  emergencyPhone: "",
  guestNotes: "",
  roomNumber: "",
  checkInDate: today,
  checkOutDate: "",
  adults: 1,
  children: 0,
  purpose: "",
  specialRequests: "",
  discount: 0,
  guestsCount: 1,
  paymentMethod: "cash",
  amountPaid: 0,
  paymentNotes: "",
  vatApplied: true,
  vatExemptionReason: "",
  vatExemptionNotes: "",
};

type WalkInPageContentProps = {
  access: WalkInAccess;
  defaultTaxRate: number;
  defaultVatApplied: boolean;
  canOverrideVat: boolean;
};

function WizardField({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-2 ${fullWidth ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export function WalkInPageContent({
  access,
  defaultTaxRate,
  defaultVatApplied,
  canOverrideVat,
}: WalkInPageContentProps) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [availableRooms, setAvailableRooms] = useState<WalkInRoomOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    guestId: string;
    reservationId: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingRooms, startRoomTransition] = useTransition();

  useEffect(() => {
    if (!form.checkInDate || !form.checkOutDate || form.checkOutDate <= form.checkInDate) {
      setAvailableRooms([]);
      return;
    }

    startRoomTransition(async () => {
      const rooms = await getWalkInAvailableRoomsAction(
        form.checkInDate,
        form.checkOutDate
      );
      setAvailableRooms(rooms);
      if (form.roomNumber && !rooms.some((r) => r.roomNumber === form.roomNumber)) {
        setForm((f) => ({ ...f, roomNumber: "" }));
      }
    });
  }, [form.checkInDate, form.checkOutDate, form.roomNumber]);

  const selectedRoom = availableRooms.find((r) => r.roomNumber === form.roomNumber);
  const nights =
    form.checkInDate && form.checkOutDate
      ? nightsBetween(form.checkInDate, form.checkOutDate)
      : 0;
  const subtotal =
    selectedRoom && nights > 0 ? selectedRoom.price * nights : 0;
  const vatApplied = form.vatApplied ?? defaultVatApplied;

  const settlement = useMemo(
    () =>
      buildPaymentSettlement({
        guestName: form.fullName,
        roomNumber: form.roomNumber,
        roomCategory: selectedRoom?.roomType,
        chargeBase: subtotal,
        discount: form.discount,
        vatRate: defaultTaxRate,
        vatApplied,
        amountPaid: 0,
        paymentAmount: form.amountPaid,
      }),
    [
      form.fullName,
      form.roomNumber,
      form.discount,
      form.amountPaid,
      selectedRoom,
      subtotal,
      defaultTaxRate,
      vatApplied,
    ]
  );

  const total = settlement.totalDue;
  const balance = settlement.remainingAfterPayment;

  useEffect(() => {
    if (step !== 4) return;
    setForm((f) => ({ ...f, amountPaid: settlement.outstandingBalance }));
  }, [vatApplied, settlement.totalDue, step]);

  const summary = useMemo(
    () =>
      buildWalkInSummaryData({
        fullName: form.fullName,
        phone: form.phone,
        roomNumber: form.roomNumber,
        selectedRoom,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        nights,
        total,
        amountPaid: form.amountPaid,
        balance,
      }),
    [
      form.fullName,
      form.phone,
      form.roomNumber,
      form.checkInDate,
      form.checkOutDate,
      form.amountPaid,
      selectedRoom,
      nights,
      total,
      balance,
    ]
  );

  function toSubmitPayload(): WalkInFormValues {
    return {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      nationality: form.nationality,
      idType: form.idType,
      idNumber: form.idNumber,
      roomNumber: form.roomNumber,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      paymentMethod: form.paymentMethod,
      amountPaid: roundCurrency(form.amountPaid),
      discount: form.discount,
      paymentNotes: form.paymentNotes,
      vatApplied: form.vatApplied ?? defaultVatApplied,
      vatExemptionReason: form.vatExemptionReason,
      vatExemptionNotes: form.vatExemptionNotes,
    };
  }

  function canAdvance(currentStep: number): boolean {
    if (currentStep === 1) return Boolean(form.fullName.trim());
    if (currentStep === 2) {
      return Boolean(
        form.checkInDate &&
          form.checkOutDate &&
          form.checkOutDate > form.checkInDate
      );
    }
    if (currentStep === 3) return Boolean(form.roomNumber);
    if (currentStep === 4) {
      if (form.amountPaid < 0) return false;
      if (!vatApplied && defaultTaxRate > 0 && !form.vatExemptionReason?.trim()) {
        return false;
      }
      if (
        form.vatExemptionReason === "Other" &&
        !form.vatExemptionNotes?.trim()
      ) {
        return false;
      }
      return true;
    }
    return true;
  }

  function handleConfirm() {
    setError(null);
    const payload = toSubmitPayload();
    startTransition(async () => {
      const result = await completeWalkInAction(payload);
      if (result.success) {
        toast.celebrate(
          "Walk-In Complete",
          `${form.fullName} checked in successfully.`
        );
        refresh();
        setSuccess({
          guestId: result.guestId,
          reservationId: result.reservationId,
        });
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  if (success) {
    return (
      <PageContainer title="Walk-In Booking" description={siteConfig.name}>
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold">Walk-in complete</h2>
            <ul className="mx-auto mt-4 max-w-xs space-y-1 text-left text-sm text-muted-foreground">
              <li>✓ Guest created</li>
              <li>✓ Reservation created</li>
              <li>✓ Payment recorded</li>
              <li>✓ Guest checked in</li>
              <li>✓ Room marked occupied</li>
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={`/dashboard/guests/${success.guestId}`}>View guest</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/reservations/${success.reservationId}`}>
                  View reservation
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  setStep(1);
                  setForm(initial);
                }}
              >
                New walk-in
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Walk-In Booking"
      description="Register and check in a guest immediately."
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex gap-2">
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-6 pt-6">
                {step === 1 && (
                  <>
                    <h3 className="font-semibold">Guest Information</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <WizardField label="Full Name">
                        <Input
                          value={form.fullName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, fullName: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Phone">
                        <Input
                          value={form.phone}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, phone: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Email">
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Nationality">
                        <Input
                          value={form.nationality}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, nationality: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="ID Number">
                        <Input
                          value={form.idNumber}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, idNumber: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="ID Type">
                        <select
                          value={form.idType}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              idType: e.target.value as IdType,
                            }))
                          }
                          className={selectClass}
                        >
                          {ID_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </WizardField>
                      <WizardField label="Address">
                        <Input
                          value={form.address}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, address: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Occupation">
                        <Input
                          value={form.occupation}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, occupation: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Emergency Contact">
                        <Input
                          value={form.emergencyContact}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              emergencyContact: e.target.value,
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Emergency Phone">
                        <Input
                          value={form.emergencyPhone}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              emergencyPhone: e.target.value,
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Notes" fullWidth>
                        <Textarea
                          value={form.guestNotes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, guestNotes: e.target.value }))
                          }
                          rows={3}
                        />
                      </WizardField>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="font-semibold">Stay Information</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <WizardField label="Check-In Date">
                        <Input
                          type="date"
                          value={form.checkInDate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, checkInDate: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Check-Out Date">
                        <Input
                          type="date"
                          value={form.checkOutDate}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              checkOutDate: e.target.value,
                              roomNumber: "",
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Adults">
                        <Input
                          type="number"
                          min={1}
                          value={form.adults}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              adults: Number(e.target.value) || 1,
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Children">
                        <Input
                          type="number"
                          min={0}
                          value={form.children}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              children: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Purpose">
                        <Input
                          value={form.purpose}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, purpose: e.target.value }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Special Requests">
                        <Input
                          value={form.specialRequests}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              specialRequests: e.target.value,
                            }))
                          }
                        />
                      </WizardField>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="font-semibold">Room Information</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <WizardField label="Room Type">
                        <Input
                          readOnly
                          value={selectedRoom?.roomType ?? ""}
                          placeholder="Select a room"
                        />
                      </WizardField>
                      <WizardField label="Floor">
                        <Input
                          readOnly
                          value={selectedRoom?.floorLabel ?? ""}
                          placeholder="Select a room"
                        />
                      </WizardField>
                      <WizardField label="Room">
                        <select
                          value={form.roomNumber}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, roomNumber: e.target.value }))
                          }
                          className={selectClass}
                          disabled={loadingRooms || availableRooms.length === 0}
                        >
                          <option value="">
                            {loadingRooms
                              ? "Loading rooms…"
                              : availableRooms.length === 0
                                ? "No available rooms for selected dates"
                                : "Select room"}
                          </option>
                          {availableRooms.map((r) => (
                            <option key={r.id} value={r.roomNumber}>
                              {r.roomNumber} — {r.roomType} (
                              {formatCurrency(r.price)}/night)
                            </option>
                          ))}
                        </select>
                      </WizardField>
                      <WizardField label="Rate">
                        <Input
                          readOnly
                          value={
                            selectedRoom ? formatCurrency(selectedRoom.price) : ""
                          }
                          placeholder="—"
                        />
                      </WizardField>
                      <WizardField label="Guests Count">
                        <Input
                          type="number"
                          min={1}
                          value={form.guestsCount}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              guestsCount: Number(e.target.value) || 1,
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Discount">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.discount || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              discount: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      </WizardField>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h3 className="font-semibold">Payment</h3>
                    <PaymentChargeSummary settlement={settlement} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <WizardField label="Payment Amount">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.amountPaid || ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              amountPaid: roundCurrency(Number(e.target.value) || 0),
                            }))
                          }
                        />
                      </WizardField>
                      <WizardField label="Payment Method">
                        <select
                          value={form.paymentMethod}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              paymentMethod: e.target.value as TransactionPaymentMethod,
                            }))
                          }
                          className={selectClass}
                        >
                          {PAYMENT_METHOD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </WizardField>
                      <WizardField label="Reference" fullWidth>
                        <Input
                          readOnly
                          value="Auto-generated on completion"
                          className="text-muted-foreground"
                        />
                      </WizardField>
                      <WizardField label="Notes" fullWidth>
                        <Textarea
                          value={form.paymentNotes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, paymentNotes: e.target.value }))
                          }
                          rows={3}
                        />
                      </WizardField>
                    </div>
                    <PaymentTaxSection
                      vatRate={defaultTaxRate}
                      vatApplied={vatApplied}
                      vatAmount={settlement.vatAmount}
                      canOverrideVat={canOverrideVat}
                      values={{
                        vatApplied,
                        vatExemptionReason: form.vatExemptionReason,
                        vatExemptionNotes: form.vatExemptionNotes,
                      }}
                      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                    />
                  </>
                )}

                {step === 5 && (
                  <>
                    <h3 className="font-semibold">Review & Confirm</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ReviewCard title="Guest">
                        <ReviewRow label="Name" value={form.fullName} />
                        <ReviewRow label="Phone" value={form.phone} />
                        <ReviewRow label="Email" value={form.email} />
                        <ReviewRow label="Nationality" value={form.nationality} />
                      </ReviewCard>
                      <ReviewCard title="Reservation">
                        <ReviewRow label="Check-In" value={form.checkInDate} />
                        <ReviewRow label="Check-Out" value={form.checkOutDate} />
                        <ReviewRow label="Nights" value={String(nights)} />
                        <ReviewRow label="Adults" value={String(form.adults)} />
                        <ReviewRow label="Children" value={String(form.children)} />
                      </ReviewCard>
                      <ReviewCard title="Room">
                        <ReviewRow label="Room" value={form.roomNumber} />
                        <ReviewRow label="Type" value={selectedRoom?.roomType ?? ""} />
                        <ReviewRow label="Floor" value={selectedRoom?.floorLabel ?? ""} />
                        <ReviewRow
                          label="Rate"
                          value={
                            selectedRoom ? formatCurrency(selectedRoom.price) : ""
                          }
                        />
                      </ReviewCard>
                      <ReviewCard title="Payment">
                        <ReviewRow
                          label="Method"
                          value={
                            PAYMENT_METHOD_OPTIONS.find(
                              (o) => o.value === form.paymentMethod
                            )?.label ?? form.paymentMethod
                          }
                        />
                        <ReviewRow label="Total" value={formatCurrency(total)} />
                        <ReviewRow label="Paid" value={formatCurrency(form.amountPaid)} />
                        <ReviewRow label="Balance" value={formatCurrency(balance)} />
                      </ReviewCard>
                      <div className="md:col-span-2">
                        <ReviewCard title="Summary">
                          <ReviewRow label="Purpose" value={form.purpose} />
                          <ReviewRow label="Special Requests" value={form.specialRequests} />
                          <ReviewRow
                            label="Reservation Preview"
                            value={summary.reservationPreview}
                          />
                        </ReviewCard>
                      </div>
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    disabled={step === 1}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  {step < STEP_COUNT ? (
                    <Button
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!canAdvance(step)}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConfirm}
                      disabled={isPending || !access.canComplete}
                    >
                      {isPending ? "Processing…" : "Complete Walk-In"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              <WalkInSummaryPanel data={summary} />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6">
              <WalkInSummaryPanel data={summary} />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
