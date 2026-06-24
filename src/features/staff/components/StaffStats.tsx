import {
  Ban,
  ConciergeBell,
  Shield,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { StaffStats } from "@/types/staff";

export function StaffStatsGrid({ stats }: { stats: StaffStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Total Staff" value={stats.total} icon={Users} />
      <StatCard
        title="Active Staff"
        value={stats.active}
        icon={UserCog}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <StatCard title="Managers" value={stats.managers} icon={Shield} />
      <StatCard
        title="Receptionists"
        value={stats.receptionists}
        icon={ConciergeBell}
        iconClassName="bg-violet-500/10 text-violet-600"
      />
      <StatCard
        title="Housekeeping"
        value={stats.housekeeping}
        icon={Sparkles}
        iconClassName="bg-teal-500/10 text-teal-600"
      />
      <StatCard
        title="Suspended"
        value={stats.suspended}
        icon={Ban}
        iconClassName="bg-amber-500/10 text-amber-600"
      />
    </div>
  );
}
