import Link from "next/link";
import { BedDouble } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function RoomNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <BedDouble className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Room not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The room you are looking for does not exist in the SEDVIS HOTEL
        inventory.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/dashboard/rooms">Back to Rooms</Link>
      </Button>
    </div>
  );
}
