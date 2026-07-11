import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingPaymentLifecycleBadge } from "@/components/payments/BookingPaymentLifecycleBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  resolveBookingPaymentLifecycle,
  resolveWalkInSummaryRoomStatus,
} from "@/lib/payments/booking-payment-lifecycle";
import { formatCurrency } from "@/lib/utils";
import type { BookingPaymentPolicy } from "@/types/booking-payment";
import type { WalkInRoomOption } from "@/types/walk-in";

export type WalkInSummaryData = {
  fullName: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  floorLabel: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  total: number | null;
  amountPaid: number;
  balance: number | null;
  paymentLifecycle: ReturnType<typeof resolveBookingPaymentLifecycle>;
  roomStatusLabel: string;
  roomStatusVariant: "reserved" | "occupied" | "operational";
  reservationPreview: string;
};

type WalkInSummaryPanelProps = {
  data: WalkInSummaryData;
  className?: string;
};

export function WalkInSummaryPanel({ data, className }: WalkInSummaryPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <SummaryRow label="Guest Name" value={data.fullName || "—"} />
        <SummaryRow label="Phone" value={data.phone || "—"} />
        <SummaryRow label="Check-In Date" value={data.checkInDate || "—"} />
        <SummaryRow
          label="Check-Out Date"
          value={data.checkOutDate || "—"}
        />
        <SummaryRow label="Room" value={data.roomNumber || "—"} />
        <SummaryRow label="Room Type" value={data.roomType || "—"} />
        <SummaryRow
          label="Nights"
          value={data.nights > 0 ? String(data.nights) : "—"}
        />
        <SummaryRow
          label="Total"
          value={data.total != null && data.total > 0 ? formatCurrency(data.total) : "—"}
        />
        <SummaryRow label="Amount Paid" value={formatCurrency(data.amountPaid)} />
        <SummaryRow
          label="Balance"
          value={
            data.balance != null ? formatCurrency(data.balance) : "—"
          }
          emphasize
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Payment Status</span>
          <BookingPaymentLifecycleBadge status={data.paymentLifecycle} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Room Status</span>
          <StatusBadge
            status={data.roomStatusVariant}
            label={data.roomStatusLabel}
          />
        </div>
        <SummaryRow label="Reservation Preview" value={data.reservationPreview} mono />
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
  mono,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-right ${emphasize ? "font-semibold" : "font-medium"} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function buildWalkInSummaryData(input: {
  wizardStep: number;
  fullName: string;
  phone: string;
  roomNumber: string;
  selectedRoom?: WalkInRoomOption;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  total: number;
  amountPaid: number;
  paymentPolicy: BookingPaymentPolicy;
}): WalkInSummaryData {
  const roomSelected = Boolean(input.roomNumber);
  const showPricing = input.wizardStep >= 3 && roomSelected;
  const draftAmountPaid = input.wizardStep >= 4 ? input.amountPaid : 0;
  const total = showPricing ? input.total : null;
  const balance =
    showPricing && total != null
      ? Math.max(0, total - draftAmountPaid)
      : null;

  const paymentLifecycle = resolveBookingPaymentLifecycle({
    wizardStep: input.wizardStep,
    totalAmount: input.total,
    amountPaid: draftAmountPaid,
    paymentPolicy: input.paymentPolicy,
    roomSelected,
  });

  const roomStatus = resolveWalkInSummaryRoomStatus(
    input.roomNumber,
    input.wizardStep
  );

  const year = new Date().getFullYear();
  const reservationPreview = input.roomNumber
    ? `RES-${year}-PREVIEW`
    : "Assigned on completion";

  return {
    fullName: input.fullName,
    phone: input.phone,
    roomNumber: input.roomNumber,
    roomType: input.selectedRoom?.roomType ?? "",
    floorLabel: input.selectedRoom?.floorLabel ?? "",
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    nights: input.wizardStep >= 2 ? input.nights : 0,
    total,
    amountPaid: draftAmountPaid,
    balance,
    paymentLifecycle,
    roomStatusLabel: roomStatus.label,
    roomStatusVariant:
      roomStatus.key === "selected" ? "reserved" : "operational",
    reservationPreview,
  };
}
