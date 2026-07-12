"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react";

import { EnhancedGroupOperationsPanel } from "@/features/group-reservations/components/EnhancedGroupOperationsPanel";
import { ReservationBlockVisualization } from "@/features/group-reservations/components/ReservationBlockVisualization";
import { GroupStatusBadge } from "@/components/group-reservations/GroupStatusBadge";
import { PricingCard } from "@/components/pricing/PricingCard";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import {
  bulkGroupCheckInAction,
  bulkGroupCheckOutAction,
} from "@/features/group-reservations/actions";
import type { GroupDetailData } from "@/features/group-reservations/load-group-pages";
import { GROUP_BILLING_POLICY_LABELS, GROUP_TYPE_LABELS } from "@/types/group-reservation";
import { GROUP_TIMELINE_EVENT_LABELS } from "@/types/group-timeline";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const TAB_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "reservations", label: "Reservations" },
  { id: "guests", label: "Guests" },
  { id: "timeline", label: "Timeline" },
  { id: "folio", label: "Master Folio" },
  { id: "blocks", label: "Blocks" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "activity", label: "Activity" },
] as const;

const TIMELINE_CATEGORIES = [
  "all",
  "reservations",
  "guests",
  "payments",
  "check_in",
  "check_out",
  "activity",
] as const;

type Props = {
  data: GroupDetailData;
  initialTab?: string;
};

export function GroupDetailPageContent({ data, initialTab = "overview" }: Props) {
  const { group, summary, financial, overview, timeline, childFolios, access, intelligence } =
    data;
  const [tab, setTab] = useState(initialTab);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState("");

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timeline;
    return timeline.filter((e) => {
      if (timelineFilter === "reservations") {
        return e.eventType.includes("reservation") || e.eventType.includes("room");
      }
      if (timelineFilter === "guests") return e.eventType.includes("guest");
      if (timelineFilter === "payments") {
        return ["payment_recorded", "deposit_paid", "invoice_generated", "refund"].includes(
          e.eventType
        );
      }
      if (timelineFilter === "check_in") return e.eventType === "guest_checked_in";
      if (timelineFilter === "check_out") return e.eventType === "guest_checked_out";
      return true;
    });
  }, [timeline, timelineFilter]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const ids = overview.reservations
      .filter((r) => r.status === "confirmed" || r.status === "checked_in")
      .map((r) => r.id);
    setSelected(new Set(ids));
  }

  async function handleBulkCheckIn() {
    const ids = [...selected];
    const result = await bulkGroupCheckInAction(ids);
    setActionMsg(result.success ? "Check-in completed." : result.error);
  }

  async function handleBulkCheckOut() {
    const ids = [...selected];
    const result = await bulkGroupCheckOutAction(ids);
    setActionMsg(result.success ? "Check-out completed." : result.error);
  }

  return (
    <PageContainer
      title={group.groupName}
      description={`${group.groupNumber} · ${GROUP_TYPE_LABELS[group.groupType]} · ${siteConfig.name}`}
      actions={
        <div className="flex items-center gap-2">
          <GroupStatusBadge status={group.status} />
          {access.canEdit && group.status === "draft" && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/group-reservations/${group.id}?tab=overview`}>
                Edit
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <EnhancedGroupOperationsPanel
        overview={overview}
        intelligence={intelligence}
        financial={financial}
        groupId={group.id}
        canManage={access.canManage}
        onTabChange={setTab}
      />

      {actionMsg && (
        <p className="text-sm text-muted-foreground">{actionMsg}</p>
      )}

      <div className="flex flex-wrap gap-1 border-b pb-2">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Group Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Billing:</span> {GROUP_BILLING_POLICY_LABELS[group.billingPolicy]}</p>
                <p><span className="text-muted-foreground">Company:</span> {summary.corporateAccountName ?? "—"}</p>
                <p><span className="text-muted-foreground">Stay:</span> {group.arrivalDate} → {group.departureDate}</p>
                <p><span className="text-muted-foreground">Expected:</span> {group.expectedRooms} rooms · {group.expectedGuests} guests</p>
                {group.notes && <p className="text-muted-foreground">{group.notes}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Charges: {formatCurrency(financial?.totalCharges ?? 0)}</p>
                <p>Payments: {formatCurrency(financial?.totalPayments ?? 0)}</p>
                <p className="font-semibold">Outstanding: {formatCurrency(financial?.outstandingBalance ?? 0)}</p>
                <p className="text-muted-foreground">Child folios: {financial?.childFolioCount ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "reservations" && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>Select All</Button>
            {access.canManage && (
              <>
                <Button size="sm" onClick={handleBulkCheckIn} disabled={selected.size === 0}>
                  Bulk Check-In
                </Button>
                <Button size="sm" variant="secondary" onClick={handleBulkCheckOut} disabled={selected.size === 0}>
                  Bulk Check-Out
                </Button>
              </>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Select</th>
                  <th className="px-4 py-2 text-left">Reservation</th>
                  <th className="px-4 py-2 text-left">Guest</th>
                  <th className="px-4 py-2 text-left">Room</th>
                  <th className="px-4 py-2 text-left">Dates</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overview.reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.reservationNumber}</td>
                    <td className="px-4 py-2">{r.guestName}</td>
                    <td className="px-4 py-2">{r.roomNumber || "—"}</td>
                    <td className="px-4 py-2">
                      {r.checkInDate} → {resolveEffectiveCheckOutDate(r)}
                    </td>
                    <td className="px-4 py-2">
                      <ReservationStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/reservations/${r.id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "guests" && (
        <div className="mt-6">
          <div className="grid gap-3">
            {overview.reservations.map((r) => (
              <Card key={r.id}>
                <CardContent className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {r.roomNumber || "unassigned"} · {r.adults} adults · {r.children} children
                      </p>
                    </div>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                  <PricingCard
                    rackRate={r.rackRate}
                    chargedRate={r.chargedRate}
                    discountAmount={r.discountAmount}
                    discountPercent={r.discountPercent}
                    pricingMode={r.pricingMode}
                    pricingSource={r.pricingSource}
                    overrideReason={r.overrideReason}
                    overrideReasonDetail={r.overrideReasonDetail}
                    approvedById={r.approvedById}
                    numberOfNights={r.numberOfNights}
                    priceLocked
                    compact
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TIMELINE_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={timelineFilter === cat ? "default" : "outline"}
                onClick={() => setTimelineFilter(cat)}
              >
                {cat.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredTimeline.map((event) => (
              <Card key={event.id}>
                <CardContent className="flex items-start justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {GROUP_TIMELINE_EVENT_LABELS[event.eventType]}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.staffName && (
                      <p className="text-xs text-muted-foreground">{event.staffName}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "folio" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Accommodation</CardTitle></CardHeader><CardContent className="text-lg font-bold">{formatCurrency(financial?.totalCharges ?? 0)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payments</CardTitle></CardHeader><CardContent className="text-lg font-bold text-emerald-600">{formatCurrency(financial?.totalPayments ?? 0)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding</CardTitle></CardHeader><CardContent className="text-lg font-bold text-amber-600">{formatCurrency(financial?.outstandingBalance ?? 0)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Grand Total</CardTitle></CardHeader><CardContent className="text-lg font-bold">{formatCurrency(financial?.totalCharges ?? 0)}</CardContent></Card>
          </div>

          {financial?.masterFolioId && (
            <Button asChild>
              <Link href={`/dashboard/guest-folio/${financial.masterFolioId}`}>
                <Wallet className="mr-2 h-4 w-4" />
                Open Master Folio
              </Link>
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Child Folios</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {childFolios.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No child folios linked yet.</p>
              ) : (
                childFolios.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{f.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.folioNumber} · Room {f.roomNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(f.outstandingBalance)}</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/guest-folio/${f.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "blocks" && (
        <div className="mt-6">
          <ReservationBlockVisualization insights={intelligence.blockInsights} />
        </div>
      )}

      {tab === "invoices" && (
        <div className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-50" />
              <p>Invoices are generated from the master folio and individual reservations.</p>
              {financial?.masterFolioId && (
                <Button className="mt-4" variant="outline" asChild>
                  <Link href={`/dashboard/guest-folio/${financial.masterFolioId}`}>View Folio Documents</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "payments" && (
        <div className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <CreditCard className="mb-3 h-10 w-10 opacity-50" />
              <p>Payments received: {formatCurrency(financial?.totalPayments ?? 0)}</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/dashboard/payments">View All Payments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "activity" && (
        <div className="mt-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Activity log entries are recorded via GroupReservationService and appear in the timeline.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
