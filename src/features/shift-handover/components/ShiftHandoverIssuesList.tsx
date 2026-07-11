"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { resolveShiftIssueAction } from "@/features/shift-handover/actions";
import { useToast } from "@/hooks/use-toast";
import { formatHandoverTimestamp } from "@/lib/shift-handover/format";
import type { ShiftHandoverAccess } from "@/lib/auth/shift-handover-access.types";
import type { ShiftHandoverIssue } from "@/types/shift-handover";

type ShiftHandoverIssuesListProps = {
  issues: ShiftHandoverIssue[];
  access: ShiftHandoverAccess;
  highlight?: boolean;
};

export function ShiftHandoverIssuesList({
  issues,
  access,
  highlight = false,
}: ShiftHandoverIssuesListProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  if (issues.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No outstanding issues.</p>
    );
  }

  function resolveIssue(issueId: string) {
    startTransition(async () => {
      const result = await resolveShiftIssueAction(issueId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Issue marked as resolved.");
      router.refresh();
    });
  }

  return (
    <ul className={`space-y-2 ${highlight ? "rounded-lg border border-amber-200/60 bg-amber-50/30 p-3 dark:border-amber-900/40 dark:bg-amber-950/20" : ""}`}>
      {issues.map((issue) => (
        <li
          key={issue.id}
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{issue.description}</p>
            <p className="text-xs text-muted-foreground">
              Reported {formatHandoverTimestamp(issue.createdAt)}
              {issue.createdByName ? ` by ${issue.createdByName}` : ""}
            </p>
          </div>
          {access.canCloseShift ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => resolveIssue(issue.id)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Resolve
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
