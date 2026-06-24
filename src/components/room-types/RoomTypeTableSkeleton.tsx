import { TableSkeletonLoader } from "@/components/loading/TableSkeletonLoader";

export function RoomTypeTableSkeleton() {
  return <TableSkeletonLoader rows={6} columns={5} />;
}
