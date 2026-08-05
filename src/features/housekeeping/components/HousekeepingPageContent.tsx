"use client";

import { useMemo, useState } from "react";

import { HousekeepingEmptyState } from "@/components/housekeeping/HousekeepingEmptyState";
import { HousekeepingRoomCard } from "@/components/housekeeping/HousekeepingRoomCard";
import { HousekeepingTaskPanel } from "@/components/housekeeping/HousekeepingTaskPanel";
import { HotelWorkflowDiagram } from "@/components/housekeeping/HotelWorkflowDiagram";
import { DepartureClassificationBadge } from "@/components/reservations/DepartureClassificationBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HousekeepingAccess } from "@/lib/auth/housekeeping-access.types";
import { siteConfig } from "@/config/site";
import type { HousekeepingTask, HousekeepingStats, CleaningStatus } from "@/types/housekeeping";
import { Brush, CheckCircle, Clock, Wrench } from "lucide-react";

const COLUMNS: { status: CleaningStatus; title: string; headerClass: string }[] =
  [
    {
      status: "pending_cleaning",
      title: "Pending Cleaning",
      headerClass: "border-t-amber-500 bg-amber-500/5",
    },
    {
      status: "cleaning",
      title: "Cleaning",
      headerClass: "border-t-blue-500 bg-blue-500/5",
    },
    {
      status: "ready",
      title: "Ready",
      headerClass: "border-t-emerald-500 bg-emerald-500/5",
    },
    {
      status: "maintenance",
      title: "Maintenance",
      headerClass: "border-t-slate-500 bg-slate-500/5",
    },
  ];

type HousekeepingPageContentProps = {
  tasks: HousekeepingTask[];
  stats: HousekeepingStats;
  access: HousekeepingAccess;
  departureWatch: HousekeepingTask[];
};

export function HousekeepingPageContent({
  tasks,
  stats,
  access,
  departureWatch,
}: HousekeepingPageContentProps) {
  const [selected, setSelected] = useState<HousekeepingTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const byColumn = useMemo(() => {
    const map: Record<CleaningStatus, HousekeepingTask[]> = {
      pending_cleaning: [],
      cleaning: [],
      ready: [],
      maintenance: [],
    };
    for (const t of tasks) {
      map[t.status].push(t);
    }
    return map;
  }, [tasks]);

  return (
    <PageContainer
      title="Housekeeping"
      description={`Room readiness board for ${siteConfig.name}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Cleaning"
          value={stats.pendingCleaning}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Currently Cleaning"
          value={stats.currentlyCleaning}
          icon={Brush}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Ready Rooms"
          value={stats.readyRooms}
          icon={CheckCircle}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Maintenance Rooms"
          value={stats.maintenanceRooms}
          icon={Wrench}
        />
      </div>

      <HotelWorkflowDiagram />

      {departureWatch.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting Checkout</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departureWatch.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-3 text-sm shadow-sm"
              >
                <p className="font-mono text-lg font-bold">{item.roomNumber}</p>
                <p className="text-xs text-muted-foreground">{item.lastGuest}</p>
                <div className="mt-2">
                  {item.departureClassification ? (
                    <DepartureClassificationBadge
                      classification={item.departureClassification}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.departureLabel}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tasks.length === 0 ? (
        <HousekeepingEmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className={`rounded-xl border border-t-4 ${col.headerClass}`}
            >
              <div className="border-b px-3 py-2.5">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {byColumn[col.status].length} rooms
                </p>
              </div>
              <div className="space-y-2 p-3 min-h-[120px]">
                {byColumn[col.status].length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No rooms
                  </p>
                ) : (
                  byColumn[col.status].map((task) => (
                    <HousekeepingRoomCard
                      key={task.id}
                      task={task}
                      onClick={() => {
                        setSelected(task);
                        setPanelOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <HousekeepingTaskPanel
        task={selected}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        access={access}
      />
    </PageContainer>
  );
}
