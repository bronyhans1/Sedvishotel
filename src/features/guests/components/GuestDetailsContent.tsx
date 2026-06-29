"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { EditGuestModal } from "@/components/guests/EditGuestModal";
import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GuestAccess } from "@/lib/auth/guest-access.types";
import { getGuestStayHistory } from "@/lib/guests/stay-history";
import { formatCurrency } from "@/lib/utils";
import { ID_TYPE_OPTIONS, type Guest } from "@/types/guest";
import type { Reservation, ReservationStatus } from "@/types/reservation";

const idLabels = Object.fromEntries(
  ID_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

type GuestDetailsContentProps = {
  guest: Guest;
  access: GuestAccess;
  guestReservations: Reservation[];
};

export function GuestDetailsContent({
  guest,
  access,
  guestReservations,
}: GuestDetailsContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const stayHistory = useMemo(
    () => getGuestStayHistory(guest.email, guestReservations),
    [guest.email, guestReservations]
  );

  const profileStats = useMemo(() => {
    const totalNights = stayHistory.reduce((s, h) => s + h.nights, 0);
    const visits = Math.max(guest.totalVisits, stayHistory.length);
    return {
      totalVisits: visits,
      totalNights,
      totalSpent: guest.totalSpent,
      averageStayDuration:
        visits > 0 ? Math.round((totalNights / visits) * 10) / 10 : 0,
    };
  }, [guest, stayHistory]);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/guests">
              <ArrowLeft className="h-4 w-4" />
              Back to Guests
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{guest.fullName}</h1>
            {guest.vipStatus && (
              <Crown className="h-6 w-6 text-brand-gold" />
            )}
          </div>
          <GuestStatusBadge status={guest.guestStatus} />
        </div>
        {access.canEdit && (
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit Guest
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Visits", value: profileStats.totalVisits },
          { label: "Total Nights Stayed", value: profileStats.totalNights },
          { label: "Total Amount Spent", value: formatCurrency(profileStats.totalSpent) },
          {
            label: "Avg Stay Duration",
            value: `${profileStats.averageStayDuration} nights`,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <User className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="font-medium">{guest.fullName}</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{guest.phone || "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{guest.email || "—"}</p>
              </div>
            </div>
            <Separator />
            <p>
              <span className="text-muted-foreground">Nationality: </span>
              {guest.nationality || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">ID Type: </span>
              {idLabels[guest.idType]}
            </p>
            <p>
              <span className="text-muted-foreground">ID Number: </span>
              <span className="font-mono">{guest.idNumber || "—"}</span>
            </p>
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{guest.address || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guest Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {guest.notes.length > 0 ? (
              <ul className="space-y-2">
                {guest.notes.map((note, i) => (
                  <li
                    key={i}
                    className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notes on file.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stay History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {stayHistory.length > 0 ? (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Reservation #</th>
                  <th className="pb-2 font-medium">Room</th>
                  <th className="pb-2 font-medium">Check-In</th>
                  <th className="pb-2 font-medium">Check-Out</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stayHistory.map((stay) => (
                  <tr key={stay.reservationId}>
                    <td className="py-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/reservations/${stay.reservationId}`}
                        className="text-primary hover:underline"
                      >
                        {stay.reservationNumber}
                      </Link>
                    </td>
                    <td className="py-3">{stay.roomNumber}</td>
                    <td className="py-3">{stay.checkInDate}</td>
                    <td className="py-3">{stay.checkOutDate}</td>
                    <td className="py-3">{formatCurrency(stay.amountPaid)}</td>
                    <td className="py-3">
                      <ReservationStatusBadge
                        status={stay.status as ReservationStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No stay history recorded for this guest yet.
            </p>
          )}
        </CardContent>
      </Card>

      {access.canEdit && (
        <EditGuestModal
          guest={guest}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
