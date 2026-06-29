import { Tags } from "lucide-react";

export function ProductsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Tags className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">No products yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Add retail products to your catalog. They will power POS sales, inventory,
        and guest folio charging in later stages.
      </p>
    </div>
  );
}
