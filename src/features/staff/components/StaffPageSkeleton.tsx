import { PageLoader } from "@/components/loading/PageLoader";

export function StaffPageSkeleton() {
  return (
    <PageLoader
      statCount={6}
      tableColumns={6}
      tableRows={8}
      showAvatar
    />
  );
}
