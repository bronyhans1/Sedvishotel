import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function RoomNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-2xl font-bold">Room not found</h1>
      <p className="mt-2 text-muted-foreground">This accommodation category does not exist.</p>
      <Button asChild className="mt-6">
        <Link href="/rooms">View all rooms</Link>
      </Button>
    </div>
  );
}
