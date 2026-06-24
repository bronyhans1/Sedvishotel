"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";
import { StayDetailsDrawer } from "@/components/stays/StayDetailsDrawer";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import type { StaysAccess } from "@/lib/auth/stays-access.types";
import type { CheckOutAccess } from "@/lib/auth/check-out-access.types";
import type { CheckoutPolicy } from "@/types/late-checkout";
import { siteConfig } from "@/config/site";
import type { ActiveStay, StayStats } from "@/types/stay";
import { BedDouble, CalendarMinus, CalendarPlus, Users } from "lucide-react";

type StaysPageContentProps = {
  activeStays: ActiveStay[];
  stayStats: StayStats;
  access: StaysAccess;
  checkoutAccess: CheckOutAccess;
  checkoutPolicy: CheckoutPolicy;
};

export function StaysPageContent({
  activeStays,
  stayStats,
  checkoutAccess,
  checkoutPolicy,
}: StaysPageContentProps) {
  const router = useRouter();
  const liveRefresh = useLiveRefresh();
  const [selected, setSelected] = useState<ActiveStay | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function refresh() {
    liveRefresh();
    router.refresh();
  }

  return (
    <PageContainer
      title="Active Stays"
      description={`Guests currently in-house at ${siteConfig.name}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Guests In House"
          value={stayStats.guestsInHouse}
          icon={Users}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Rooms Occupied"
          value={stayStats.roomsOccupied}
          icon={BedDouble}
        />
        <StatCard
          title="Arrivals Today"
          value={stayStats.arrivalsToday}
          icon={CalendarPlus}
        />
        <StatCard
          title="Departures Today"
          value={stayStats.departuresToday}
          icon={CalendarMinus}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">Guest Name</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Room Type
                </th>
                <th className="px-4 py-3 font-semibold">Check-In</th>
                <th className="px-4 py-3 font-semibold">Expected Check-Out</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeStays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No active stays
                  </td>
                </tr>
              ) : (
                activeStays.map((stay) => (
                  <tr key={stay.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{stay.guestName}</td>
                    <td className="px-4 py-3 font-mono">{stay.roomNumber}</td>
                    <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                      {stay.roomTypeName}
                    </td>
                    <td className="px-4 py-3">{stay.checkInDate}</td>
                    <td className="px-4 py-3">{stay.expectedCheckOut}</td>
                    <td className="px-4 py-3">
                      <GuestStatusBadge status={stay.guestStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelected(stay);
                          setDrawerOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StayDetailsDrawer
        stay={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        checkoutAccess={checkoutAccess}
        checkoutPolicy={checkoutPolicy}
        onEarlyCheckOutSuccess={refresh}
      />
    </PageContainer>
  );
}
