import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { FloorStatusBadge } from "@/components/floors/FloorStatusBadge";
import { Button } from "@/components/ui/button";
import type { Floor } from "@/types/floor";

type FloorTableProps = {
  floors: Floor[];
  canEdit?: boolean;
  onEdit?: (floor: Floor) => void;
};

export function FloorTable({ floors, canEdit, onEdit }: FloorTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Display Order</th>
              <th className="px-4 py-3 font-semibold">Room Count</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {floors.map((floor) => (
              <tr key={floor.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{floor.name}</td>
                <td className="px-4 py-3">{floor.displayOrder}</td>
                <td className="px-4 py-3 text-muted-foreground">{floor.roomCount}</td>
                <td className="px-4 py-3">
                  <FloorStatusBadge active={floor.active} />
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                  {floor.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/floors/${floor.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">View</span>
                      </Link>
                    </Button>
                    {canEdit && onEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(floor)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
