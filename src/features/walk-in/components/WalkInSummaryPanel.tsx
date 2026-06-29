import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
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
  total: number;
  amountPaid: number;
  balance: number;
  paymentStatus: "paid" | "partial" | "pending";
  roomStatus: string;
  reservationPreview: string;
};

type WalkInSummaryPanelProps = {
  data: WalkInSummaryData;
  className?: string;
};

function paymentStatusLabel(status: WalkInSummaryData["paymentStatus"]) {
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  return "Pending";
}

function paymentStatusVariant(
  status: WalkInSummaryData["paymentStatus"]
): "live" | "reserved" | "operational" {
  if (status === "paid") return "live";
  if (status === "partial") return "reserved";
  return "operational";
}

export function WalkInSummaryPanel({ data, className }: WalkInSummaryPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <SummaryRow label="Guest Name" value={data.fullName || "—"} />
        <SummaryRow label="Phone" value={data.phone || "—"} />
        <SummaryRow label="Room Number" value={data.roomNumber || "—"} />
        <SummaryRow label="Room Type" value={data.roomType || "—"} />
        <SummaryRow label="Check-In Date" value={data.checkInDate || "—"} />
        <SummaryRow label="Check-Out Date" value={data.checkOutDate || "—"} />
        <SummaryRow label="Nights" value={data.nights > 0 ? String(data.nights) : "—"} />
        <SummaryRow label="Total Amount" value={data.total > 0 ? formatCurrency(data.total) : "—"} />
        <SummaryRow
          label="Amount Paid"
          value={data.amountPaid > 0 ? formatCurrency(data.amountPaid) : formatCurrency(0)}
        />
        <SummaryRow
          label="Balance"
          value={data.total > 0 ? formatCurrency(data.balance) : "—"}
          emphasize
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Payment Status</span>
          <StatusBadge
            status={paymentStatusVariant(data.paymentStatus)}
            label={paymentStatusLabel(data.paymentStatus)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Room Status</span>
          <StatusBadge status="available" label={data.roomStatus} />
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
  fullName: string;
  phone: string;
  roomNumber: string;
  selectedRoom?: WalkInRoomOption;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  total: number;
  amountPaid: number;
  balance: number;
}): WalkInSummaryData {
  const paymentStatus: WalkInSummaryData["paymentStatus"] =
    input.total <= 0
      ? "pending"
      : input.balance <= 0
        ? "paid"
        : input.amountPaid > 0
          ? "partial"
          : "pending";

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
    nights: input.nights,
    total: input.total,
    amountPaid: input.amountPaid,
    balance: input.balance,
    paymentStatus,
    roomStatus: input.roomNumber ? "Available" : "—",
    reservationPreview,
  };
}
