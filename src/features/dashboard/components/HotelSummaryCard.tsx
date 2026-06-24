import { Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import type { OccupancyMetrics } from "@/lib/occupancy";

type Props = {
  occupancy: OccupancyMetrics;
};

const rows: { key: keyof OccupancyMetrics; label: string; color?: string }[] = [
  { key: "available", label: "Available", color: "text-emerald-600" },
  { key: "occupied", label: "Occupied", color: "text-blue-600" },
  { key: "reserved", label: "Reserved", color: "text-amber-600" },
  { key: "cleaning", label: "Cleaning", color: "text-violet-600" },
  { key: "maintenance", label: "Maintenance", color: "text-slate-600" },
];

export function HotelSummaryCard({ occupancy }: Props) {
  const statusSum =
    occupancy.available +
    occupancy.occupied +
    occupancy.reserved +
    occupancy.cleaning +
    occupancy.maintenance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Hotel Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {siteConfig.name} · {occupancy.total} rooms · {occupancy.occupancyRate}% occupied
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total Rooms</span>
          <span className="text-3xl font-bold">{occupancy.total}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map(({ key, label, color }) => (
            <div key={key} className="rounded-lg border p-3 text-center">
              <p className={`text-2xl font-bold ${color ?? ""}`}>
                {occupancy[key]}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Status total: {statusSum} / {occupancy.total}
          {statusSum === occupancy.total ? " ✓" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
