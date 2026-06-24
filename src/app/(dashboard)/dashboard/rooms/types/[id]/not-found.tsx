import Link from "next/link";
import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function RoomTypeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Layers className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Room type not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This room category does not exist in the SEDVIS HOTEL catalog.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/dashboard/rooms/types">Back to Room Types</Link>
      </Button>
    </div>
  );
}
