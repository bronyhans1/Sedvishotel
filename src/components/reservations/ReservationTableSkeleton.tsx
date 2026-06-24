import { TableSkeletonLoader } from "@/components/loading/TableSkeletonLoader";

export function ReservationTableSkeleton() {
  return <TableSkeletonLoader rows={8} columns={7} />;
}
