import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/types/product";

const LABELS: Record<ProductStatus, string> = {
  active: "Active",
  out_of_stock: "Out of Stock",
  inactive: "Inactive",
  discontinued: "Discontinued",
};

type ProductStatusBadgeProps = {
  status: ProductStatus;
  isActive?: boolean;
};

export function ProductStatusBadge({
  status,
  isActive = true,
}: ProductStatusBadgeProps) {
  if (!isActive) {
    return <Badge variant="secondary">Archived</Badge>;
  }

  const variant =
    status === "active"
      ? "default"
      : status === "out_of_stock"
        ? "outline"
        : "secondary";

  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
