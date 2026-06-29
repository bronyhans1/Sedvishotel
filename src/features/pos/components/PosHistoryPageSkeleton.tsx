export function PosHistoryPageSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-9 w-full max-w-3xl animate-pulse rounded-md bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
