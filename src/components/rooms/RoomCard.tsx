import Link from "next/link";

import { RoomStatusBadge, roomStatusCardStyles } from "@/components/rooms/RoomStatusBadge";
import { cn } from "@/lib/utils";
import type { Room } from "@/types/room";

type RoomCardProps = {
  room: Room;
  className?: string;
};

export function RoomCard({ room, className }: RoomCardProps) {
  return (
    <Link
      href={`/dashboard/rooms/${room.roomNumber}`}
      className={cn(
        "group flex flex-col rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-ring/20",
        roomStatusCardStyles[room.status],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight">
          {room.roomNumber}
        </span>
        <RoomStatusBadge status={room.status} />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {room.floorLabel}
      </p>
    </Link>
  );
}
