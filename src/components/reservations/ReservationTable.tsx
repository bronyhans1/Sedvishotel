import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BOOKING_SOURCE_OPTIONS, type Reservation } from "@/types/reservation";

const sourceLabels = Object.fromEntries(
  BOOKING_SOURCE_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

type Props = {
  reservations: Reservation[];
  canEdit?: boolean;
  onEdit?: (r: Reservation) => void;
};

export function ReservationTable({ reservations, canEdit, onEdit }: Props) {
  const showEdit = canEdit !== false && !!onEdit;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Reservation #</th>
              <th className="px-4 py-3 font-semibold">Guest Name</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">
                Room Type
              </th>
              <th className="px-4 py-3 font-semibold">Check-In</th>
              <th className="px-4 py-3 font-semibold">Check-Out</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                Source
              </th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                Total
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {r.reservationNumber}
                </td>
                <td className="px-4 py-3 font-medium">{r.guestName}</td>
                <td className="px-4 py-3 font-mono">{r.roomNumber}</td>
                <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                  {r.roomTypeName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.checkInDate}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.checkOutDate}</td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge status={r.status} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {r.bookingSource === "website" ? (
                    <Badge variant="secondary">Website</Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      {sourceLabels[r.bookingSource]}
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell font-medium">
                  {formatCurrency(r.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/reservations/${r.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          View
                        </span>
                      </Link>
                    </Button>
                    {showEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit!(r)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Edit
                        </span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
