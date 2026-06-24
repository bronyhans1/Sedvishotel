"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  CalendarDays,
  ClipboardList,
  Wallet,
  BedDouble,
  FileSpreadsheet,
  FileText,
  Download,
} from "lucide-react";

import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportReportAction } from "@/features/reports/actions";
import { formatCurrency } from "@/lib/utils";
import { humanizeLabel } from "@/lib/labels/humanize";
import { siteConfig } from "@/config/site";
import type { ReportsData } from "@/types/reports";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  occupancy: BedDouble,
  revenue: BarChart3,
  guests: Users,
  reservations: CalendarDays,
  housekeeping: ClipboardList,
  payments: Wallet,
};

type ReportsPageContentProps = {
  data: ReportsData;
};

export function ReportsPageContent({ data }: ReportsPageContentProps) {
  const [exportMsg, setExportMsg] = useState("");
  const [, startTransition] = useTransition();

  function handleExport(format: "PDF" | "Excel" | "CSV") {
    startTransition(async () => {
      const result = await exportReportAction(format);
      if (result.success) {
        setExportMsg(result.message);
        if (format === "CSV" && result.csvContent) {
          const blob = new Blob([result.csvContent], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `shms-reports-${new Date().toISOString().slice(0, 10)}.csv`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
      } else {
        setExportMsg(result.error);
      }
      setTimeout(() => setExportMsg(""), 4000);
    });
  }

  if (data.cards.length === 0) {
    return (
      <PageContainer title="Reports" description={`Analytics and exports for ${siteConfig.name}.`}>
        <ReportsEmptyState />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Reports" description={`Analytics and exports for ${siteConfig.name}.`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.cards.map((card) => {
          const Icon = icons[card.id] ?? BarChart3;
          return (
            <Link key={card.id} href={card.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card id="occupancy">
        <CardHeader><CardTitle>Occupancy Report</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p>Total rooms: <strong>{data.occupancy.totalRooms}</strong></p>
            <p>Available: <strong>{data.occupancy.availableRooms}</strong></p>
            <p>Occupied: <strong>{data.occupancy.occupiedRooms}</strong></p>
            <p>Reserved: <strong>{data.occupancy.reservedRooms}</strong></p>
            <p>Cleaning: <strong>{data.occupancy.cleaningRooms}</strong></p>
            <p>Maintenance: <strong>{data.occupancy.maintenanceRooms}</strong></p>
            <p>Occupancy: <strong>{data.occupancy.occupancyPercentage}%</strong></p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Floor breakdown</p>
            {data.occupancy.floorBreakdown.map((f) => (
              <p key={f.floor} className="text-sm text-muted-foreground">{f.floor}: {f.occupied}/{f.total}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card id="revenue">
        <CardHeader><CardTitle>Revenue Report</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-sm">
          <div><p className="text-muted-foreground">Daily</p><p className="font-bold">{formatCurrency(data.revenue.daily)}</p></div>
          <div><p className="text-muted-foreground">Weekly</p><p className="font-bold">{formatCurrency(data.revenue.weekly)}</p></div>
          <div><p className="text-muted-foreground">Monthly</p><p className="font-bold">{formatCurrency(data.revenue.monthly)}</p></div>
          <div><p className="text-muted-foreground">Yearly</p><p className="font-bold">{formatCurrency(data.revenue.yearly)}</p></div>
          <div><p className="text-muted-foreground">Outstanding</p><p className="font-bold">{formatCurrency(data.revenue.outstandingBalances)}</p></div>
          <div><p className="text-muted-foreground">Invoices</p><p className="font-bold">{data.revenue.paidInvoices} paid / {data.revenue.unpaidInvoices} unpaid</p></div>
        </CardContent>
      </Card>

      <Card id="guests">
        <CardHeader><CardTitle>Guest Report</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div><p className="text-muted-foreground">Total guests</p><p className="font-bold">{data.guests.totalGuests}</p></div>
          <div><p className="text-muted-foreground">Returning</p><p className="font-bold">{data.guests.returningGuests}</p></div>
          <div><p className="text-muted-foreground">VIP</p><p className="font-bold">{data.guests.vipGuests}</p></div>
          <div><p className="text-muted-foreground">Avg stay</p><p className="font-bold">{data.guests.averageStayDuration} nights</p></div>
        </CardContent>
      </Card>

      <Card id="reservations">
        <CardHeader><CardTitle>Reservation Report</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {Object.entries(data.reservations).map(([k, v]) => (
            <div key={k} className="rounded-lg border px-4 py-2">
              <span className="text-muted-foreground">
                {humanizeLabel(k.replace(/([A-Z])/g, " $1"))}:{" "}
              </span>
              <strong>{v}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="payments">
        <CardHeader><CardTitle>Payment Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SimpleBarChart data={data.payments.byMethod} monetary />
          <p className="text-sm">Outstanding: <strong>{formatCurrency(data.payments.outstandingBalances)}</strong></p>
          <p className="text-sm">Refunds: {data.payments.refundSummary.count} ({formatCurrency(data.payments.refundSummary.amount)})</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export Center</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleExport("PDF")}><FileText className="h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => handleExport("Excel")}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={() => handleExport("CSV")}><Download className="h-4 w-4" /> CSV</Button>
          {exportMsg && <p className="w-full text-sm text-emerald-600">{exportMsg}</p>}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
