"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  groupPermissionsByModule,
  PERMISSION_GROUP_SECTIONS,
  type PermissionGroup,
} from "@/lib/permissions/labels";
import { cn } from "@/lib/utils";

type Props = {
  permissionCount: number;
  permissionCodes: string[];
  className?: string;
};

function ModuleGroup({ group }: { group: PermissionGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm"
      >
        <span className="font-medium">{group.moduleLabel}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs">{group.permissions.length} permissions</span>
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </button>
      {open ? (
        <ul className="space-y-1 border-t px-3 py-2 text-sm text-muted-foreground">
          {group.permissions.map((permission) => (
            <li key={permission.code} className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{permission.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PermissionGroupsCard({
  permissionCount,
  permissionCodes,
  className,
}: Props) {
  const groups = groupPermissionsByModule(permissionCodes);
  const groupsByModule = Object.fromEntries(groups.map((g) => [g.moduleId, g]));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Role & Permissions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {permissionCount} permission grants across {groups.length} modules
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {PERMISSION_GROUP_SECTIONS.map((section) => {
          const sectionGroups = section.modules
            .map((moduleId) => groupsByModule[moduleId])
            .filter((group): group is PermissionGroup => Boolean(group));

          if (sectionGroups.length === 0) return null;

          return (
            <div key={section.title} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <div className={cn("space-y-2")}>
                {sectionGroups.map((group) => (
                  <ModuleGroup key={group.moduleId} group={group} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
