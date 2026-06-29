import {
  CalendarCheck,
  CalendarX,
  Crown,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { GuestStats } from "@/types/guest";

export function GuestsStats({ stats }: { stats: GuestStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Total Guests" value={stats.totalGuests} icon={Users} />
      <StatCard
        title="Current Guests"
        value={stats.currentGuests}
        icon={UserCheck}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Returning Guests"
        value={stats.returningGuests}
        icon={RefreshCw}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="VIP Guests"
        value={stats.vipGuests}
        icon={Crown}
        iconClassName="bg-brand-gold/20 text-brand-gold"
      />
      <StatCard
        title="Check-Ins Today"
        value={stats.checkInsToday}
        icon={CalendarCheck}
      />
      <StatCard
        title="Check-Outs Today"
        value={stats.checkOutsToday}
        icon={CalendarX}
      />
    </div>
  );
}
