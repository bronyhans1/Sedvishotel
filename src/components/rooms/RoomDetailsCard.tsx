import {
  BedDouble,
  Building2,
  CircleDollarSign,
  DoorOpen,
  FileText,
  Users,
} from "lucide-react";

import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Room } from "@/types/room";

type RoomDetailsCardProps = {
  room: Room;
};

export function RoomDetailsCard({ room }: RoomDetailsCardProps) {
  const details = [
    {
      icon: DoorOpen,
      label: "Room Number",
      value: room.roomNumber,
    },
    {
      icon: BedDouble,
      label: "Room Type",
      value: room.roomType,
    },
    {
      icon: Building2,
      label: "Floor",
      value: room.floorLabel,
    },
    {
      icon: CircleDollarSign,
      label: "Price",
      value: room.price > 0 ? formatCurrency(room.price) : "Not configured",
    },
    {
      icon: Users,
      label: "Capacity",
      value: room.capacity > 0 ? `${room.capacity} guests` : "Not configured",
    },
    {
      icon: FileText,
      label: "Description",
      value: room.description,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Room Information</CardTitle>
        <RoomStatusBadge status={room.status} />
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
  );
}
