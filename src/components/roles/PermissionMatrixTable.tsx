"use client";

import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLE_COLUMNS,
} from "@/lib/roles/matrix";
import type {
  PermissionAction,
  PermissionMatrix,
  PermissionModule,
  StaffRoleId,
} from "@/types/role";

const actionLabels: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage",
  override_vat: "Override VAT",
};

function isActionApplicable(moduleId: PermissionModule, action: PermissionAction): boolean {
  return action !== "override_vat" || moduleId === "payments";
}

const roleLabels: Record<StaffRoleId, string> = {
  admin: "Admin",
  manager: "Manager",
  receptionist: "Receptionist",
  housekeeping: "Housekeeping",
};

type Props = {
  matrix: PermissionMatrix;
  readOnly?: boolean;
  onToggle?: (
    module: PermissionModule,
    role: StaffRoleId,
    action: PermissionAction,
    granted: boolean
  ) => void;
};

export function PermissionMatrixTable({ matrix, readOnly = true, onToggle }: Props) {
  const actionCount = PERMISSION_ACTIONS.length;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 font-semibold">
                Module
              </th>
              {ROLE_COLUMNS.map((role) => (
                <th
                  key={role}
                  colSpan={actionCount}
                  className="border-l px-2 py-3 text-center font-semibold"
                >
                  {roleLabels[role]}
                </th>
              ))}
            </tr>
            <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/30 px-4 py-2" />
              {ROLE_COLUMNS.map((role) =>
                PERMISSION_ACTIONS.map((action) => (
                  <th
                    key={`${role}-${action}`}
                    className="border-l px-1 py-2 text-center font-medium whitespace-nowrap"
                  >
                    {actionLabels[action as PermissionAction]}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {PERMISSION_MODULES.map((mod) => (
              <tr key={mod.id} className="hover:bg-muted/20">
                <td className="sticky left-0 z-10 bg-card px-4 py-2 font-medium">
                  {mod.label}
                </td>
                {ROLE_COLUMNS.map((role) =>
                  (PERMISSION_ACTIONS as PermissionAction[]).map((action) => {
                    const applicable = isActionApplicable(mod.id as PermissionModule, action);
                    const checked = applicable
                      ? matrix[mod.id as PermissionModule][role][action]
                      : false;
                    return (
                      <td
                        key={`${mod.id}-${role}-${action}`}
                        className="border-l px-2 py-2 text-center"
                      >
                        {!applicable ? (
                          <span className="text-muted-foreground">—</span>
                        ) : readOnly ? (
                          <input
                            type="checkbox"
                            readOnly
                            defaultChecked={checked}
                            className="pointer-events-none h-4 w-4 rounded border-input accent-primary"
                            aria-label={`${mod.label} ${roleLabels[role]} ${actionLabels[action]}`}
                            tabIndex={-1}
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              onToggle?.(mod.id as PermissionModule, role, action, !checked)
                            }
                            className="h-4 w-4 rounded border-input accent-primary"
                            aria-label={`${mod.label} ${roleLabels[role]} ${actionLabels[action]}`}
                          />
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        {readOnly
          ? "Live permission matrix from database (read-only)."
          : "Toggle permissions and click Save Changes to persist."}
      </p>
    </div>
  );
}
