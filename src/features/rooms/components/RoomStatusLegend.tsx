import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { STATUS_OPTIONS } from "@/types/room";

export function RoomStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Status board
      </span>
      {STATUS_OPTIONS.map((s) => (
        <RoomStatusBadge key={s.value} status={s.value} />
      ))}
    </div>
  );
}
