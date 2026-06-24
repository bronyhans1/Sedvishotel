import { Badge } from "@/components/ui/badge";

type FloorStatusBadgeProps = {
  active: boolean;
};

export function FloorStatusBadge({ active }: FloorStatusBadgeProps) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Archived"}
    </Badge>
  );
}
