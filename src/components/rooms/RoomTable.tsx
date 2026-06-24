import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/types/room";

type RoomTableProps = {
  rooms: Room[];
  canEdit?: boolean;
  onEdit?: (room: Room) => void;
};

export function RoomTable({ rooms, canEdit, onEdit }: RoomTableProps) {
  const showEdit = canEdit !== false && !!onEdit;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Room Number</th>
              <th className="px-4 py-3 font-semibold">Floor</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                Room Type
              </th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">
                Price
              </th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">
                Capacity
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rooms.map((room) => (
              <tr
                key={room.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-mono font-semibold">
                  {room.roomNumber}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {room.floorLabel}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {room.roomType}
                </td>
                <td className="px-4 py-3">
                  <RoomStatusBadge status={room.status} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {room.price > 0
                    ? formatCurrency(room.price)
                    : "—"}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {room.capacity > 0 ? room.capacity : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/rooms/${room.roomNumber}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          View
                        </span>
                      </Link>
                    </Button>
                    {showEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit!(room)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Edit
                        </span>
                      </Button>
                    )}
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
