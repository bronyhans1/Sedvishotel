import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OPERATIONAL_LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import { resolvePagination } from "@/lib/pagination/pagination";

type PaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  /** Optional noun after the count, for example "reservations". */
  itemLabel?: string;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  total,
  pageSize = OPERATIONAL_LIST_PAGE_SIZE,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  const state = resolvePagination({ page, total, pageSize });

  if (!state.showControls || state.from == null || state.to == null) {
    return null;
  }

  const countLabel = itemLabel
    ? `Showing ${state.from}–${state.to} of ${state.total} ${itemLabel}`
    : `Showing ${state.from}–${state.to} of ${state.total}`;

  return (
    <nav
      aria-label="Pagination"
      className="flex max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">{countLabel}</p>
      <div className="flex max-w-full flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={state.page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(state.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {state.pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === state.page ? "default" : "outline"}
              size="sm"
              className="min-w-8 px-2"
              aria-label={
                item === state.page ? `Page ${item}, current page` : `Page ${item}`
              }
              aria-current={item === state.page ? "page" : undefined}
              onClick={() => {
                if (item !== state.page) onPageChange(item);
              }}
            >
              {item}
            </Button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={state.page >= state.totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(state.page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
