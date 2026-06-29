import Link from "next/link";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PENDING_WEBSITE_RESERVATIONS_HREF,
} from "@/lib/reservations/pending-website-reservations";
import { formatReservationSubmittedAt } from "@/lib/reservations/booking-information";
import { formatCurrency } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";

type PendingWebsiteReservationsWidgetProps = {
  reservations: Reservation[];
};

export function PendingWebsiteReservationsWidget({
  reservations,
}: PendingWebsiteReservationsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Pending Website Reservations
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={PENDING_WEBSITE_RESERVATIONS_HREF}>View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending website reservations.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Reservation</th>
                  <th className="hidden pb-2 pr-4 font-medium md:table-cell">
                    Room Type
                  </th>
                  <th className="hidden pb-2 pr-4 font-medium lg:table-cell">
                    Check-In
                  </th>
                  <th className="hidden pb-2 pr-4 font-medium lg:table-cell">
                    Check-Out
                  </th>
                  <th className="hidden pb-2 pr-4 font-medium xl:table-cell">
                    Submitted
                  </th>
                  <th className="hidden pb-2 pr-4 font-medium sm:table-cell">
                    Nights
                  </th>
                  <th className="hidden pb-2 pr-4 font-medium sm:table-cell">
                    Amount
                  </th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-medium">{r.guestName}</td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {r.reservationNumber}
                    </td>
                    <td className="hidden py-3 pr-4 md:table-cell">
                      {r.roomTypeName}
                    </td>
                    <td className="hidden py-3 pr-4 whitespace-nowrap lg:table-cell">
                      {r.checkInDate}
                    </td>
                    <td className="hidden py-3 pr-4 whitespace-nowrap lg:table-cell">
                      {r.checkOutDate}
                    </td>
                    <td className="hidden py-3 pr-4 whitespace-nowrap xl:table-cell">
                      {formatReservationSubmittedAt(r.createdAt)}
                    </td>
                    <td className="hidden py-3 pr-4 sm:table-cell">
                      {r.numberOfNights}
                    </td>
                    <td className="hidden py-3 pr-4 sm:table-cell">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/reservations/${r.id}`}>
                          View Reservation
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
