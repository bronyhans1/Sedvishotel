"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STAFF_ROLE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  type StaffFormValues,
} from "@/types/staff";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  values: StaffFormValues;
  onChange: (values: StaffFormValues) => void;
  showStatus?: boolean;
};

export function StaffFormFields({ values, onChange, showStatus = true }: Props) {
  const set = <K extends keyof StaffFormValues>(key: K, val: StaffFormValues[K]) =>
    onChange({ ...values, [key]: val });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={values.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Role</Label>
          <select
            className={selectClass}
            value={values.role}
            onChange={(e) =>
              set("role", e.target.value as StaffFormValues["role"])
            }
          >
            {STAFF_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            value={values.department}
            onChange={(e) => set("department", e.target.value)}
          />
        </div>
      </div>
      {showStatus ? (
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            className={selectClass}
            value={values.status}
            onChange={(e) =>
              set("status", e.target.value as StaffFormValues["status"])
            }
          >
            {STAFF_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
