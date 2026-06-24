import { Layers } from "lucide-react";

export function RoomTypesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Layers className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">No room types yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Room types from Supabase will appear here. Add a category to define pricing
        and capacity for your inventory.
      </p>
    </div>
  );
}
