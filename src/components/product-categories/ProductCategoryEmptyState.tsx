import { Tags } from "lucide-react";

export function ProductCategoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Tags className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">No product categories yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create categories to organize retail items such as drinks, snacks, and
        toiletries before products are added in the next stage.
      </p>
    </div>
  );
}
