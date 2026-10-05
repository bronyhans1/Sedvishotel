import {
  OPERATIONAL_LIST_PAGE_SIZE,
  PAGE_QUERY_PARAM,
} from "./constants";

export type PageWindowItem = number | "ellipsis";

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** 1-based inclusive display start. Null when there are no rows. */
  from: number | null;
  /** 1-based inclusive display end. Null when there are no rows. */
  to: number | null;
  showControls: boolean;
  pages: PageWindowItem[];
  /** Inclusive Supabase `.range()` start (0-based). */
  supabaseFrom: number;
  /** Inclusive Supabase `.range()` end (0-based). */
  supabaseTo: number;
};

function sanitizePageSize(pageSize: number | undefined): number {
  if (pageSize == null || !Number.isFinite(pageSize) || pageSize < 1) {
    return OPERATIONAL_LIST_PAGE_SIZE;
  }
  return Math.floor(pageSize);
}

function sanitizeTotal(total: number): number {
  if (!Number.isFinite(total) || total < 0) return 0;
  return Math.floor(total);
}

/** 1-based page count. Zero when there are no rows. */
export function getTotalPages(total: number, pageSize: number): number {
  const safeTotal = sanitizeTotal(total);
  const safeSize = sanitizePageSize(pageSize);
  if (safeTotal === 0) return 0;
  return Math.ceil(safeTotal / safeSize);
}

/**
 * Clamp to a 1-based page.
 * Values below 1 become 1. Values past the last page become the last page.
 * An empty result set stays on page 1.
 */
export function normalizePage(page: number, totalPages: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  const floored = Math.floor(page);
  if (!Number.isFinite(totalPages) || totalPages < 1) return 1;
  if (floored > totalPages) return totalPages;
  return floored;
}

/**
 * Read `page` from a query string. Missing, blank, and non-numeric values become 1.
 * Does not clamp to a known total; call `normalizePage` once the total is known.
 */
export function parsePageParam(
  value: string | string[] | undefined | null
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw.trim() === "") return 1;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

/**
 * Compact page list. Always includes the first page, the last page, and the
 * current page with one neighbor on each side. Gaps become a single ellipsis.
 */
export function getPageWindow(
  currentPage: number,
  totalPages: number
): PageWindowItem[] {
  if (totalPages < 1) return [];

  const current = normalizePage(currentPage, totalPages);
  const included: number[] = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNeighbor = page >= current - 1 && page <= current + 1;
    if (isEdge || isNeighbor) included.push(page);
  }

  const window: PageWindowItem[] = [];
  let previous: number | undefined;

  for (const page of included) {
    if (previous != null) {
      const gap = page - previous;
      if (gap === 2) window.push(previous + 1);
      else if (gap > 2) window.push("ellipsis");
    }
    window.push(page);
    previous = page;
  }

  return window;
}

export function resolvePagination(input: {
  page: number;
  total: number;
  pageSize?: number;
}): PaginationState {
  const pageSize = sanitizePageSize(input.pageSize);
  const total = sanitizeTotal(input.total);
  const totalPages = getTotalPages(total, pageSize);
  const page = normalizePage(input.page, totalPages);
  const supabaseFrom = (page - 1) * pageSize;
  const supabaseTo = supabaseFrom + pageSize - 1;

  if (total === 0) {
    return {
      page,
      pageSize,
      total,
      totalPages,
      from: null,
      to: null,
      showControls: false,
      pages: [],
      supabaseFrom,
      supabaseTo,
    };
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    from: supabaseFrom + 1,
    to: Math.min(page * pageSize, total),
    showControls: total > pageSize,
    pages: getPageWindow(page, totalPages),
    supabaseFrom,
    supabaseTo,
  };
}

/** Copy search params and set `page`, leaving every other key unchanged. */
export function withPageParam(
  searchParams: URLSearchParams,
  page: number
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  next.set(PAGE_QUERY_PARAM, String(safePage));
  return next;
}

/** Same as `withPageParam` for page 1. Use when search or filters change. */
export function resetPageParam(searchParams: URLSearchParams): URLSearchParams {
  return withPageParam(searchParams, 1);
}

/** Path plus query string. Existing parameters other than `page` are preserved. */
export function buildPageHref(
  pathname: string,
  searchParams: URLSearchParams | string,
  page: number,
  options?: { total?: number; pageSize?: number }
): string {
  const current =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : searchParams;
  const totalPages =
    options?.total == null
      ? 0
      : getTotalPages(options.total, sanitizePageSize(options.pageSize));
  const safePage =
    options?.total == null ? parsePageParam(String(page)) : normalizePage(page, totalPages);
  const next = withPageParam(current, safePage);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
