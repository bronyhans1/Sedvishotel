import { TableSkeletonLoader } from "@/components/loading/TableSkeletonLoader";

export function GuestTableSkeleton() {
  return <TableSkeletonLoader rows={8} columns={5} />;
}
