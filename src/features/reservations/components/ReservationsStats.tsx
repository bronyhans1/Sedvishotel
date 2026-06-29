import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LogOut,
  XCircle,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { ReservationStats } from "@/types/reservation";

type Props = { stats: ReservationStats };

export function ReservationsStats({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Reservations"
        value={stats.total}
        icon={ClipboardList}
      />
      <StatCard
        title="Pending Reservations"
        value={stats.pending}
        icon={CalendarClock}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Confirmed Reservations"
        value={stats.confirmed}
        icon={CheckCircle2}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Checked-In Guests"
        value={stats.checkedIn}
        icon={CalendarCheck}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Checked-Out Guests"
        value={stats.checkedOut}
        icon={LogOut}
        iconClassName="bg-slate-500/10 text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Cancelled Reservations"
        value={stats.cancelled}
        icon={XCircle}
        iconClassName="bg-red-500/10 text-red-600 dark:text-red-400"
      />
    </div>
  );
}
