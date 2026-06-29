import { Badge } from "@/components/ui/badge";

type ProductCategoryStatusBadgeProps = {
  isActive: boolean;
};

export function ProductCategoryStatusBadge({
  isActive,
}: ProductCategoryStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Archived"}
    </Badge>
  );
}
