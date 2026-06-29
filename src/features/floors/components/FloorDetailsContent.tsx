"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { EditFloorModal } from "@/components/floors/EditFloorModal";
import { FloorStatusBadge } from "@/components/floors/FloorStatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { archiveFloorAction } from "@/features/floors/actions";
import { useToast } from "@/hooks/use-toast";
import type { FloorAccess } from "@/lib/auth/floor-access.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Floor } from "@/types/floor";

type FloorDetailsContentProps = {
  floor: Floor;
  access: FloorAccess;
};

export function FloorDetailsContent({ floor, access }: FloorDetailsContentProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  function runArchive() {
    setConfirmArchiveOpen(false);
    startTransition(async () => {
      const result = await archiveFloorAction(floor.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Floor Archived", `"${floor.name}" archived.`);
      router.push("/dashboard/floors");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/floors">
              <ArrowLeft className="h-4 w-4" />
              Back to Floors
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{floor.name}</h1>
            <p className="text-muted-foreground">Display order {floor.displayOrder}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FloorStatusBadge active={floor.active} />
          {access.canEdit && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          {access.canArchive && floor.active && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmArchiveOpen(true)}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Floor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Room count: </span>
            <span className="font-medium">{floor.roomCount}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Description: </span>
            <span className="font-medium">{floor.description || "—"}</span>
          </p>
        </CardContent>
      </Card>

      {access.canEdit && (
        <EditFloorModal
          floor={floor}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => router.refresh()}
        />
      )}

      <ConfirmDialog
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        title="Archive floor?"
        description={`Archive "${floor.name}"? Floors with assigned rooms cannot be archived.`}
        confirmLabel="Archive"
        loading={isPending}
        onConfirm={runArchive}
      />
    </div>
  );
}
