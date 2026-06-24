import {
  BedDouble,
  CircleDollarSign,
  FileText,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { RoomTypeStatusBadge } from "@/components/room-types/RoomTypeStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { RoomType } from "@/types/room-type";

type RoomTypeDetailsCardProps = {
  roomType: RoomType;
};

export function RoomTypeDetailsCard({ roomType }: RoomTypeDetailsCardProps) {
  const details = [
    { icon: FileText, label: "Description", value: roomType.description },
    { icon: CircleDollarSign, label: "Price", value: formatCurrency(roomType.defaultPrice) },
    { icon: Users, label: "Capacity", value: `${roomType.capacity} guest${roomType.capacity > 1 ? "s" : ""}` },
    { icon: BedDouble, label: "Room Count", value: `${roomType.assignedRoomNumbers.length}` },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Type Information</CardTitle>
          <RoomTypeStatusBadge status={roomType.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {details.map((item, index) => (
            <div key={item.label}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-gold" />
            Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {roomType.amenities.map((a) => (
              <li
                key={a}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
              >
                {a}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Assigned Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {roomType.assignedRoomNumbers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {roomType.assignedRoomNumbers.map((num) => (
                <Link
                  key={num}
                  href={`/dashboard/rooms/${num}`}
                  className="rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {num}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No rooms are assigned to this room type yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
