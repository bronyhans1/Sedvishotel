import Link from "next/link";
import { CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ReservationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <CalendarX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Reservation not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This booking does not exist in the SEDVIS HOTEL system.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/dashboard/reservations">Back to Reservations</Link>
      </Button>
    </div>
  );
}
