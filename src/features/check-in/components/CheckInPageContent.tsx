"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

import { CheckInModal } from "@/components/check-in/CheckInModal";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { CheckInAccess } from "@/lib/auth/check-in-access.types";
import type { CheckInPageStats } from "@/services/reservation.service";
import { siteConfig } from "@/config/site";
import type { Reservation } from "@/types/reservation";
import {
  CalendarCheck,
  Clock,
  UserPlus,
  Users,
} from "lucide-react";

type CheckInPageContentProps = {
  pendingCheckIns: Reservation[];
  stats: CheckInPageStats;
  access: CheckInAccess;
  today: string;
};

export function CheckInPageContent({
  pendingCheckIns,
  stats,
  access,
  today,
}: CheckInPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const openCheckIn = (r: Reservation) => {
    setSelected(r);
    setModalOpen(true);
  };

  return (
    <PageContainer
      title="Check-In"
      description={`Process arrivals at ${siteConfig.name} · Today: ${today}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Arrivals"
          value={stats.todayArrivals}
          icon={Users}
        />
        <StatCard
          title="Pending Check-Ins"
          value={stats.pendingCheckIns}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Completed Check-Ins"
          value={stats.completedCheckInsToday}
          icon={CalendarCheck}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Walk-In Guests"
          value={stats.walkInsToday}
          icon={UserPlus}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">Reservation #</th>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Check-In Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingCheckIns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No pending check-ins
                  </td>
                </tr>
              ) : (
                pendingCheckIns.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.reservationNumber}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.guestName}</td>
                    <td className="px-4 py-3 font-mono">{r.roomNumber}</td>
                    <td className="px-4 py-3">{r.checkInDate}</td>
                    <td className="px-4 py-3">
                      <ReservationStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/reservations/${r.id}`}>
                            View
                          </Link>
                        </Button>
                        {access.canProcess && r.status === "confirmed" && (
                          <Button size="sm" onClick={() => openCheckIn(r)}>
                            <LogIn className="h-4 w-4" />
                            Check-In
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {access.canProcess && (
        <CheckInModal
          reservation={selected}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
