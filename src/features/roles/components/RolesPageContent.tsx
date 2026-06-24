"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { PermissionMatrixTable } from "@/components/roles/PermissionMatrixTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveRolePermissionsAction } from "@/features/roles/actions";
import { useToast } from "@/hooks/use-toast";
import { countPermissionsForRole } from "@/lib/roles/matrix";
import type { RolesAccess } from "@/lib/auth/roles-access";
import { siteConfig } from "@/config/site";
import type {
  PermissionAction,
  PermissionMatrix,
  PermissionModule,
  RoleDefinition,
  StaffRoleId,
} from "@/types/role";

type Props = {
  roles: RoleDefinition[];
  matrix: PermissionMatrix;
  readOnly: boolean;
  access: RolesAccess;
};

function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return structuredClone(matrix) as PermissionMatrix;
}

export function RolesPageContent({
  roles,
  matrix: initialMatrix,
  readOnly,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<StaffRoleId>("admin");
  const [matrix, setMatrix] = useState(() => cloneMatrix(initialMatrix));
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = roles.find((r) => r.id === selectedId) ?? roles[0];

  useEffect(() => {
    setMatrix(cloneMatrix(initialMatrix));
  }, [initialMatrix]);

  const isDirty = useMemo(
    () => JSON.stringify(matrix) !== JSON.stringify(initialMatrix),
    [matrix, initialMatrix]
  );

  const handleToggle = (
    module: PermissionModule,
    role: StaffRoleId,
    action: PermissionAction,
    granted: boolean
  ) => {
    setMatrix((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [role]: {
          ...prev[module][role],
          [action]: granted,
        },
      },
    }));
  };

  const handleSave = () => {
    setConfirmSaveOpen(false);
    startTransition(async () => {
      const result = await saveRolePermissionsAction(matrix);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Permissions Saved", "Role permissions saved.");
      router.refresh();
    });
  };

  return (
    <PageContainer
      title="Roles & Permissions"
      description={`Access control for ${siteConfig.name} modules.`}
      actions={
        !readOnly ? (
          <Button
            size="sm"
            disabled={!isDirty || isPending}
            onClick={() => setConfirmSaveOpen(true)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving Permissions…" : "Save Changes"}
          </Button>
        ) : undefined
      }
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0 pb-4">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedId(role.id)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                  selectedId === role.id
                    ? "border-l-2 border-primary bg-muted/40 font-medium"
                    : ""
                }`}
              >
                {role.name}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {role.usersAssigned} users
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{selected.description}</p>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Permissions summary</p>
                  <p className="text-2xl font-bold">
                    {countPermissionsForRole(matrix, selected.id)} grants
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Users assigned</p>
                  <p className="text-2xl font-bold">{selected.usersAssigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PermissionMatrixTable
            matrix={matrix}
            readOnly={readOnly}
            onToggle={readOnly ? undefined : handleToggle}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title="Save permission changes?"
        description="This will update role_permissions for all roles in the matrix. Staff may need to sign in again for changes to apply."
        confirmLabel="Save Changes"
        loading={isPending}
        onConfirm={handleSave}
      />
    </PageContainer>
  );
}
