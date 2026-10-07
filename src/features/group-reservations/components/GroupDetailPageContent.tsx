"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react";

import { EnhancedGroupOperationsPanel } from "@/features/group-reservations/components/EnhancedGroupOperationsPanel";
import { GroupSlotGuestField } from "@/features/group-reservations/components/GroupSlotGuestField";
import { ReservationBlockVisualization } from "@/features/group-reservations/components/ReservationBlockVisualization";
import { GroupStatusBadge } from "@/components/group-reservations/GroupStatusBadge";
import { PricingCard } from "@/components/pricing/PricingCard";
import { DepartureClassificationBadge } from "@/components/reservations/DepartureClassificationBadge";
import { ReservationStatusBadge } from "@/components/reservations/ReservationStatusBadge";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, nightsBetween } from "@/lib/utils";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import {
  addGroupReservationAction,
  assignGroupRoomAction,
  bulkGroupCheckInAction,
  bulkGroupCheckOutAction,
} from "@/features/group-reservations/actions";
import {
  assignmentErrorMessage,
  assignmentRowControls,
  assignmentSuccessMessage,
  claimAssignmentRow,
  guestRoomAssignmentErrorMessage,
  releaseAssignmentRow,
} from "@/lib/group-reservations/assignment-feedback";
import {
  placeholderReservationGuest,
  type AssignableGuest,
} from "@/lib/group-reservations/guest-identity";
import {
  assignmentRoomOffer,
  groupAvailableRoomsByType,
  preferredRoomEstimate,
} from "@/lib/group-reservations/assignment-room-choices";
import {
  GROUP_SECTION_SCROLL_CLASS,
  groupSectionId,
} from "@/lib/group-reservations/section-nav";
import {
  reservationNeedsRoom,
  unassignedPlaceholderCount,
} from "@/lib/group-reservations/unassigned-slots";
import type { GroupDetailData } from "@/features/group-reservations/load-group-pages";
import { GROUP_BILLING_POLICY_LABELS, GROUP_TYPE_LABELS } from "@/types/group-reservation";
import { GROUP_TIMELINE_EVENT_LABELS } from "@/types/group-timeline";
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
  const {
    group,
    summary,
    financial,
    overview,
    timeline,
    childFolios,
    access,
    intelligence,
    businessDate,
    checkoutPolicy,
  } = data;
  const router = useRouter();
  const toast = useToast();
  const pendingAssignmentRef = useRef<Set<string>>(new Set());
  const [tab, setTab] = useState(initialTab);
  const sectionTab = useRef(initialTab);
  const [sectionRequest, setSectionRequest] = useState(0);
  const [showOtherRoomTypes, setShowOtherRoomTypes] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState("");
  const [slotRooms, setSlotRooms] = useState<Record<string, string>>({});
  const [slotGuests, setSlotGuests] = useState<Record<string, AssignableGuest>>({});
  const [assignError, setAssignError] = useState("");
  const [pendingAssignments, setPendingAssignments] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  function claimRow(rowKey: string): boolean {
    const claim = claimAssignmentRow(pendingAssignmentRef.current, rowKey);
    if (!claim.accepted) return false;
    pendingAssignmentRef.current = claim.pending;
    setPendingAssignments(claim.pending);
    return true;
  }

  function releaseRow(rowKey: string) {
    const pending = releaseAssignmentRow(pendingAssignmentRef.current, rowKey);
    pendingAssignmentRef.current = pending;
    setPendingAssignments(pending);
  }

  async function assignExistingRoom(reservationId: string, roomNumber: string) {
    const rowKey = `reservation:${reservationId}`;
    if (!claimRow(rowKey)) return;
    setAssignError("");
    try {
      const result = await assignGroupRoomAction(group.id, reservationId, roomNumber);
      if (!result.success) {
        const message = assignmentErrorMessage(result.error);
        setAssignError(message);
        toast.error(message);
        return;
      }
      toast.success(assignmentSuccessMessage(roomNumber));
      router.refresh();
    } catch {
      const message = assignmentErrorMessage(undefined);
      setAssignError(message);
      toast.error(message);
    } finally {
      releaseRow(rowKey);
    }
  }

  async function assignPlaceholder(slotId: string) {
    const roomNumber = slotRooms[slotId];
    const guest = placeholderReservationGuest(slotGuests[slotId] ?? null);
    if (!roomNumber || !guest || !claimRow(slotId)) return;
    setAssignError("");
    try {
      const result = await addGroupReservationAction(group.id, {
        guestId: guest.guestId,
        guestName: guest.guestName,
        guestPhone: guest.guestPhone,
        guestEmail: guest.guestEmail,
        roomNumber,
        checkInDate: group.arrivalDate,
        checkOutDate: group.departureDate,
        adults: 1,
        children: 0,
        bookingSource: "phone",
        status: "confirmed",
      });
      if (!result.success) {
        const message = guestRoomAssignmentErrorMessage(result.error);
        setAssignError(message);
        toast.error(message);
        return;
      }
      setSlotRooms((current) => {
        const next = { ...current };
        delete next[slotId];
        for (const key of Object.keys(next)) {
          if (next[key] === roomNumber) delete next[key];
        }
        return next;
      });
      setSlotGuests((current) => {
        const next = { ...current };
        delete next[slotId];
        return next;
      });
      toast.success(assignmentSuccessMessage(roomNumber, guest.guestName));
      router.refresh();
    } catch {
      const message = guestRoomAssignmentErrorMessage(undefined);
      setAssignError(message);
      toast.error(message);
    } finally {
      releaseRow(slotId);
    }
  }
  const placeholderCount = unassignedPlaceholderCount(
    group.expectedRooms,
    overview.reservations
  );
  const placeholders = Array.from({ length: placeholderCount }, (_, index) => `slot-${index}`);
  const roomOffer = useMemo(
    () =>
      assignmentRoomOffer(
        data.availableRooms,
        data.group.preferredRoomTypeId,
        showOtherRoomTypes
      ),
    [data.availableRooms, data.group.preferredRoomTypeId, showOtherRoomTypes]
  );
  const stayEstimate = data.preferredRoomType
    ? preferredRoomEstimate({
        nightlyRate: data.preferredRoomType.defaultPrice,
        roomCount: data.group.expectedRooms,
        nights: nightsBetween(data.group.arrivalDate, data.group.departureDate),
      })
    : null;

  function renderRoomChoices(
    rooms: GroupDetailData["availableRooms"],
    prefix?: string
  ) {
    return groupAvailableRoomsByType(rooms).map((choice) => (
      <optgroup
        key={`${prefix ?? "available"}-${choice.roomTypeName}`}
        label={prefix ? `${prefix} · ${choice.roomTypeName}` : choice.roomTypeName}
      >
        {choice.rooms.map((room) => (
          <option key={room.id} value={room.roomNumber}>
            {room.roomNumber} · {formatCurrency(room.nightlyRate)}
          </option>
        ))}
      </optgroup>
    ));
  }

  function openGroupSection(nextTab: string) {
    sectionTab.current = nextTab;
    setTab(nextTab);
    setSectionRequest((current) => current + 1);
  }

  useEffect(() => {
    const target = sectionRequest === 0 ? initialTab : sectionTab.current;
    const sectionId = groupSectionId(target);
    if (!sectionId) return;
    if (sectionRequest === 0 && initialTab === "overview") return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [initialTab, sectionRequest]);

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
        onTabChange={openGroupSection}
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
        <div id={groupSectionId("reservations") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
          <p className="mb-3 text-sm text-muted-foreground">
            {data.preferredRoomType
              ? `Preferred room type: ${data.preferredRoomType.name}. Matching available rooms are listed first. The room you assign sets that reservation's rate.`
              : "This group has no preferred room type. Every room available for these dates is listed. The room you assign sets that reservation's rate."}
          </p>
          {stayEstimate && data.preferredRoomType ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Estimate only: {stayEstimate.roomCount} × {data.preferredRoomType.name} ×{" "}
              {stayEstimate.nights} night{stayEstimate.nights === 1 ? "" : "s"} at{" "}
              {formatCurrency(stayEstimate.nightlyRate)} per night ={" "}
              {formatCurrency(stayEstimate.subtotal)} before tax and service charge.
              Confirmed charges come from the assigned reservations and the master folio.
            </p>
          ) : null}
          {roomOffer.hasPreference && roomOffer.preferred.length === 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">
              No available {data.preferredRoomType?.name ?? "preferred"} rooms match this
              group&apos;s dates. Enable other room types to view additional available rooms.
            </p>
          ) : null}
          {roomOffer.hasPreference ? (
            <div className="mb-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowOtherRoomTypes((current) => !current)}
              >
                {showOtherRoomTypes ? "Show preferred room type only" : "Show other room types"}
              </Button>
            </div>
          ) : null}
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
                {overview.reservations.map((r) => {
                  const departure =
                    r.status === "checked_in"
                      ? resolveDepartureClassification({
                          status: r.status,
                          checkInDate: r.checkInDate,
                          scheduledCheckOutDate: r.checkOutDate,
                          businessDate,
                          policyCheckOutTime: checkoutPolicy.checkOutTime,
                        })
                      : null;
                  return (
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
                    <td className="px-4 py-2">
                      {reservationNeedsRoom(r) ? (
                        <select
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                          defaultValue=""
                          aria-label={`Assign room for ${r.reservationNumber}`}
                          disabled={
                            pendingAssignments.has(`reservation:${r.id}`) ||
                            data.availableRooms.length === 0
                          }
                          onChange={(event) => {
                            const roomNumber = event.target.value;
                            if (!roomNumber) return;
                            void assignExistingRoom(r.id, roomNumber);
                          }}
                        >
                          <option value="">
                            {pendingAssignments.has(`reservation:${r.id}`)
                              ? "Assigning…"
                              : "Choose room"}
                          </option>
                          {roomOffer.hasPreference && showOtherRoomTypes ? (
                            <>
                              {renderRoomChoices(roomOffer.preferred, "Preferred")}
                              {renderRoomChoices(roomOffer.alternatives, "Other")}
                            </>
                          ) : (
                            renderRoomChoices(roomOffer.visible)
                          )}
                        </select>
                      ) : (
                        r.roomNumber || "—"
                      )}
                      {data.preferredRoomType &&
                      r.roomNumber &&
                      r.roomTypeId !== data.preferredRoomType.slug ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Assigned {r.roomTypeName} · {formatCurrency(r.chargedRate)} / night
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">
                      {r.checkInDate} → {resolveEffectiveCheckOutDate(r)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <ReservationStatusBadge status={r.status} />
                        {departure &&
                        (departure.classification === "expected_departure" ||
                          departure.classification === "late_checkout" ||
                          departure.classification === "overstay" ||
                          departure.classification === "in_house") ? (
                          <DepartureClassificationBadge
                            classification={departure.classification}
                            label={
                              departure.classification === "in_house"
                                ? "Current Stay"
                                : departure.shortLabel
                            }
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/reservations/${r.id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                  );
                })}
                {placeholders.map((slotId, index) => {
                  const row = assignmentRowControls({
                    selectedRoom: slotRooms[slotId] ?? "",
                    guestSelected: Boolean(slotGuests[slotId]?.id),
                    pending: pendingAssignments,
                    rowKey: slotId,
                    roomsAvailable: roomOffer.visible.length > 0,
                  });
                  return (
                  <tr key={slotId}>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      Unassigned {index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <GroupSlotGuestField
                        disabled={row.submitting}
                        selected={slotGuests[slotId] ?? null}
                        onSelect={(guest) =>
                          setSlotGuests((current) => ({ ...current, [slotId]: guest }))
                        }
                        onClear={() =>
                          setSlotGuests((current) => {
                            const next = { ...current };
                            delete next[slotId];
                            return next;
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                          value={slotRooms[slotId] ?? ""}
                          aria-label={`Room for unassigned slot ${index + 1}`}
                          disabled={row.selectorDisabled}
                          onChange={(event) =>
                            setSlotRooms((current) => ({
                              ...current,
                              [slotId]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Choose room</option>
                          {roomOffer.hasPreference && showOtherRoomTypes ? (
                            <>
                              {renderRoomChoices(roomOffer.preferred, "Preferred")}
                              {renderRoomChoices(roomOffer.alternatives, "Other")}
                            </>
                          ) : (
                            renderRoomChoices(roomOffer.visible)
                          )}
                        </select>
                        <SubmitButton
                          type="button"
                          size="sm"
                          loading={row.submitting}
                          loadingLabel="Assigning…"
                          disabled={row.assignDisabled}
                          onClick={() => void assignPlaceholder(slotId)}
                        >
                          Assign
                        </SubmitButton>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {group.arrivalDate} → {group.departureDate}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">Unassigned</td>
                    <td className="px-4 py-2" />
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {assignError ? (
            <p className="mt-3 text-sm text-destructive">{assignError}</p>
          ) : null}
          {placeholderCount > 0 && data.availableRooms.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No rooms are eligible for {group.arrivalDate} → {group.departureDate}.
            </p>
          ) : null}
        </div>
      )}

      {tab === "guests" && (
        <div id={groupSectionId("guests") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
          <div className="grid gap-3">
            {overview.reservations.map((r) => {
              const departure =
                r.status === "checked_in"
                  ? resolveDepartureClassification({
                      status: r.status,
                      checkInDate: r.checkInDate,
                      scheduledCheckOutDate: r.checkOutDate,
                      businessDate,
                      policyCheckOutTime: checkoutPolicy.checkOutTime,
                    })
                  : null;
              return (
              <Card key={r.id}>
                <CardContent className="space-y-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {r.roomNumber || "unassigned"} · {r.adults} adults · {r.children} children
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ReservationStatusBadge status={r.status} />
                      {departure &&
                      (departure.classification === "expected_departure" ||
                        departure.classification === "late_checkout" ||
                        departure.classification === "overstay" ||
                        departure.classification === "in_house") ? (
                        <DepartureClassificationBadge
                          classification={departure.classification}
                          label={
                            departure.classification === "in_house"
                              ? "Current Stay"
                              : departure.shortLabel
                          }
                        />
                      ) : null}
                    </div>
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
              );
            })}
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div id={groupSectionId("timeline") ?? undefined} className={`mt-6 space-y-4 ${GROUP_SECTION_SCROLL_CLASS}`}>
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
        <div id={groupSectionId("folio") ?? undefined} className={`mt-6 space-y-4 ${GROUP_SECTION_SCROLL_CLASS}`}>
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
        <div id={groupSectionId("blocks") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
          <ReservationBlockVisualization insights={intelligence.blockInsights} />
        </div>
      )}

      {tab === "invoices" && (
        <div id={groupSectionId("invoices") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
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
        <div id={groupSectionId("payments") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
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
        <div id={groupSectionId("activity") ?? undefined} className={`mt-6 ${GROUP_SECTION_SCROLL_CLASS}`}>
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
