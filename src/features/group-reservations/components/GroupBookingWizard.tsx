"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addGroupReservationAction,
  confirmGroupAction,
  createGroupAction,
} from "@/features/group-reservations/actions";
import type { GroupWizardOptions } from "@/features/group-reservations/load-group-pages";
import { siteConfig } from "@/config/site";
import { ReservationPricingSection } from "@/components/pricing/ReservationPricingSection";
import { inferPricingModeFromBillingPolicy } from "@/lib/reservations/rate-management";
import type { ReservationPricingInput } from "@/types/pricing";
import {
  GROUP_BILLING_POLICY_LABELS,
  GROUP_TYPE_LABELS,
  type CreateGroupInput,
  type GroupBillingPolicy,
  type GroupReservationType,
} from "@/types/group-reservation";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STEPS = [
  "Group Information",
  "Stay",
  "Reservation Blocks",
  "Guest Assignment",
  "Billing",
  "Review",
];

type WizardState = CreateGroupInput & {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  adults: number;
  children: number;
  blockRoomTypeId: string;
  blockRoomCount: number;
  blockHoldUntil: string;
  assignLater: boolean;
  pricing: ReservationPricingInput;
};

const initialState: WizardState = {
  groupName: "",
  groupType: "corporate",
  billingPolicy: "company_pays_all",
  corporateAccountId: null,
  arrivalDate: "",
  departureDate: "",
  expectedRooms: 1,
  expectedGuests: 2,
  notes: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  adults: 2,
  children: 0,
  blockRoomTypeId: "",
  blockRoomCount: 1,
  blockHoldUntil: "",
  assignLater: true,
  pricing: { pricingMode: "standard" },
};

type Props = {
  options: GroupWizardOptions;
};

export function GroupBookingWizard({ options }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleCreateGroup() {
    setError("");
    const input: CreateGroupInput = {
      groupName: state.groupName,
      groupType: state.groupType,
      billingPolicy: state.billingPolicy,
      corporateAccountId: state.corporateAccountId,
      arrivalDate: state.arrivalDate,
      departureDate: state.departureDate,
      expectedRooms: state.expectedRooms,
      expectedGuests: state.expectedGuests,
      notes: state.notes,
    };
    const result = await createGroupAction(input);
    if (!result.success) {
      setError(result.error);
      return null;
    }
    setGroupId(result.id ?? null);
    return result.id ?? null;
  }

  async function handleFinish() {
    startTransition(async () => {
      let id = groupId;
      if (!id) {
        id = await handleCreateGroup();
        if (!id) return;
      }

      if (!state.assignLater) {
        await addGroupReservationAction(
          id,
          {
            guestName: state.contactName || "Group Guest",
            guestPhone: state.contactPhone,
            guestEmail: state.contactEmail,
            roomNumber: "",
            checkInDate: state.arrivalDate,
            checkOutDate: state.departureDate,
            adults: state.adults,
            children: state.children,
            bookingSource: "phone",
            status: "confirmed",
            pricing: state.pricing,
          },
          true
        );
      }

      await confirmGroupAction(id);
      router.push(`/dashboard/group-reservations/${id}`);
    });
  }

  function nextStep() {
    if (step === 0 && !state.groupName.trim()) {
      setError("Group name is required.");
      return;
    }
    if (step === 1 && (!state.arrivalDate || !state.departureDate)) {
      setError("Arrival and departure dates are required.");
      return;
    }
    setError("");
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  }

  return (
    <PageContainer
      title="Create Group Reservation"
      description={`Group booking wizard · ${siteConfig.name}`}
    >
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium ${
              i === step
                ? "border-primary bg-primary/5 text-primary"
                : i < step
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    value={state.groupName}
                    onChange={(e) => update("groupName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group Type</Label>
                  <select
                    value={state.groupType}
                    onChange={(e) =>
                      update("groupType", e.target.value as GroupReservationType)
                    }
                    className={selectClass}
                  >
                    {Object.entries(GROUP_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <select
                    value={state.corporateAccountId ?? "none"}
                    onChange={(e) =>
                      update(
                        "corporateAccountId",
                        e.target.value === "none" ? null : e.target.value
                      )
                    }
                    className={selectClass}
                  >
                    <option value="none">No company</option>
                    {options.corporateAccounts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={state.contactName}
                    onChange={(e) => update("contactName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={state.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={state.contactEmail}
                    onChange={(e) => update("contactEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={state.notes ?? ""}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Arrival</Label>
                <Input
                  type="date"
                  value={state.arrivalDate}
                  onChange={(e) => update("arrivalDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Departure</Label>
                <Input
                  type="date"
                  value={state.departureDate}
                  onChange={(e) => update("departureDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Adults</Label>
                <Input
                  type="number"
                  min={1}
                  value={state.adults}
                  onChange={(e) => update("adults", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Children</Label>
                <Input
                  type="number"
                  min={0}
                  value={state.children}
                  onChange={(e) => update("children", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Rooms</Label>
                <Input
                  type="number"
                  min={1}
                  value={state.expectedRooms}
                  onChange={(e) => update("expectedRooms", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Guests</Label>
                <Input
                  type="number"
                  min={1}
                  value={state.expectedGuests}
                  onChange={(e) => update("expectedGuests", Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Room Type</Label>
                <select
                  value={state.blockRoomTypeId}
                  onChange={(e) => update("blockRoomTypeId", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select room type</option>
                  {options.roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Number of Rooms</Label>
                <Input
                  type="number"
                  min={1}
                  value={state.blockRoomCount}
                  onChange={(e) => update("blockRoomCount", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hold Until</Label>
                <Input
                  type="datetime-local"
                  value={state.blockHoldUntil}
                  onChange={(e) => update("blockHoldUntil", e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground md:col-span-2">
                Room blocks can be created after the group is saved. Availability is
                checked via ReservationService.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.assignLater}
                  onChange={(e) => update("assignLater", e.target.checked)}
                />
                Assign guests later
              </label>
              {!state.assignLater && (
                <p className="text-sm text-muted-foreground">
                  A master reservation will be created using the contact details from
                  Step 1.
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Billing Policy</Label>
                <select
                  value={state.billingPolicy}
                  onChange={(e) => {
                    const billingPolicy = e.target.value as GroupBillingPolicy;
                    update("billingPolicy", billingPolicy);
                    update("pricing", {
                      ...state.pricing,
                      pricingMode: inferPricingModeFromBillingPolicy(billingPolicy),
                    });
                  }}
                  className={selectClass}
                >
                  {Object.entries(GROUP_BILLING_POLICY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {(() => {
                const roomType = options.roomTypes.find(
                  (rt) => rt.id === state.blockRoomTypeId
                ) ?? options.roomTypes[0];
                if (!roomType || !state.arrivalDate || !state.departureDate) {
                  return null;
                }
                return (
                  <ReservationPricingSection
                    rackRate={roomType.defaultPrice}
                    checkIn={state.arrivalDate}
                    checkOut={state.departureDate}
                    pricingRules={roomType.pricingRules}
                    value={state.pricing}
                    onChange={(pricing) => update("pricing", pricing)}
                  />
                );
              })()}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Group:</strong> {state.groupName}
              </p>
              <p>
                <strong>Type:</strong> {GROUP_TYPE_LABELS[state.groupType]}
              </p>
              <p>
                <strong>Stay:</strong> {state.arrivalDate} → {state.departureDate}
              </p>
              <p>
                <strong>Rooms/Guests:</strong> {state.expectedRooms} rooms ·{" "}
                {state.expectedGuests} guests
              </p>
              <p>
                <strong>Billing:</strong>{" "}
                {GROUP_BILLING_POLICY_LABELS[state.billingPolicy]}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || isPending}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button onClick={nextStep} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === STEPS.length - 1 ? "Create Group" : "Next"}
              {step < STEPS.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
