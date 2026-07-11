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
import type { GuestProfileInsights } from "@/lib/guests/profile-insights";
import { getGuestStayHistory } from "@/lib/guests/stay-history";
import { formatCurrency } from "@/lib/utils";
import { GUEST_STATUS_OPTIONS, ID_TYPE_OPTIONS, type Guest } from "@/types/guest";
import type { Reservation, ReservationStatus } from "@/types/reservation";

const idLabels = Object.fromEntries(
  ID_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

const statusLabels = Object.fromEntries(
  GUEST_STATUS_OPTIONS.map((option) => [option.value, option.label])
);

type GuestDetailsContentProps = {
  guest: Guest;
  access: GuestAccess;
  guestReservations: Reservation[];
  profileInsights: GuestProfileInsights;
};

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function GuestDetailsContent({
  guest,
  access,
  guestReservations,
  profileInsights,
}: GuestDetailsContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const stayHistory = useMemo(
    () => getGuestStayHistory(guest.id, guestReservations),
    [guest.id, guestReservations]
  );

  const averageStayDuration =
    profileInsights.totalVisits > 0
      ? Math.round(
          (profileInsights.totalNightsStayed / profileInsights.totalVisits) *
            10
        ) / 10
      : 0;

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
          { label: "Total Visits", value: profileInsights.totalVisits },
          { label: "Total Nights Stayed", value: profileInsights.totalNightsStayed },
          {
            label: "Lifetime Total Spend",
            value: formatCurrency(profileInsights.lifetimeTotalSpend),
          },
          {
            label: "Avg Stay Duration",
            value: `${averageStayDuration} nights`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guest Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">VIP: </span>
                {guest.vipStatus ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-muted-foreground">Returning Guest: </span>
                {profileInsights.returningGuest ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-muted-foreground">Current Status: </span>
                {statusLabels[guest.guestStatus]}
              </p>
              <p>
                <span className="text-muted-foreground">First Stay: </span>
                {formatValue(profileInsights.firstStay)}
              </p>
              <p>
                <span className="text-muted-foreground">Last Stay: </span>
                {formatValue(profileInsights.lastStay)}
              </p>
              <p>
                <span className="text-muted-foreground">Current Reservation: </span>
                {profileInsights.currentReservationNumber ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Current Room: </span>
                {formatValue(profileInsights.currentRoom)}
              </p>
              <p>
                <span className="text-muted-foreground">Preferred Room Type: </span>
                {formatValue(profileInsights.preferredRoomType)}
              </p>
              <p>
                <span className="text-muted-foreground">Preferred Payment: </span>
                {formatValue(profileInsights.preferredPaymentMethod)}
              </p>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Accommodation Spend: </span>
                {formatCurrency(profileInsights.lifetimeAccommodationSpend)}
              </p>
              <p>
                <span className="text-muted-foreground">POS Spend: </span>
                {formatCurrency(profileInsights.lifetimePosSpend)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <User className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="font-medium">{guest.fullName}</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{guest.phone || "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-primary" />
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
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{guest.address || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {guest.notes.length > 0 ? (
            <ul className="space-y-2">
              {guest.notes.map((note, index) => (
                <li
                  key={index}
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
