import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function StaffNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Staff member not found</h1>
      <p className="text-muted-foreground">
        The employee record you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/dashboard/staff">Back to Staff</Link>
      </Button>
    </div>
  );
}
