import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { RoomTypeStatusBadge } from "@/components/room-types/RoomTypeStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { RoomType } from "@/types/room-type";

type RoomTypeTableProps = {
  roomTypes: RoomType[];
  canEdit?: boolean;
  onEdit?: (roomType: RoomType) => void;
};

export function RoomTypeTable({ roomTypes, canEdit, onEdit }: RoomTypeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Type Name</th>
              <th className="px-4 py-3 font-semibold">Capacity</th>
              <th className="px-4 py-3 font-semibold">Base Price</th>
              <th className="px-4 py-3 font-semibold">Room Count</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roomTypes.map((type) => (
              <tr
                key={type.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{type.name}</td>
                <td className="px-4 py-3">{type.capacity}</td>
                <td className="px-4 py-3">{formatCurrency(type.defaultPrice)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {type.assignedRoomNumbers.length}
                </td>
                <td className="px-4 py-3">
                  <RoomTypeStatusBadge status={type.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/rooms/types/${type.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          View
                        </span>
                      </Link>
                    </Button>
                    {canEdit && onEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(type)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Edit
                        </span>
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
