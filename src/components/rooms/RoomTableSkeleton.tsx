import { TableSkeletonLoader } from "@/components/loading/TableSkeletonLoader";

export function RoomTableSkeleton() {
  return <TableSkeletonLoader rows={10} columns={6} />;
}
