import { ActivityActionCodes } from "@/types/database/enums";
import { formatActivityAction } from "@/lib/activity/labels";
import { activityModuleKeys, formatModuleLabel } from "@/lib/labels/humanize";

const SYSTEM_USER_LABEL = "system";
const MAX_SEARCH_LENGTH = 80;

export type ActivityLogTextSearch = {
  /** Sanitized term used inside a PostgREST ilike pattern. */
  term: string;
  /** Action codes whose displayed label contains the term. */
  actionCodes: string[];
  /** Module keys whose displayed label contains the term. */
  modules: string[];
  /** True when the displayed fallback name "System" contains the term. */
  matchMissingUserName: boolean;
};

function sanitizeSearchTerm(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/[%*_\\,()".]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a logs-page search against the same text the table shows:
 * user name (or "System"), formatted action label, and formatted module label.
 * Matching codes are returned so the query can hit stored columns without
 * loading the table into memory.
 */
export function resolveActivityLogTextSearch(
  raw: string
): ActivityLogTextSearch | null {
  const term = sanitizeSearchTerm(raw);
  if (!term) return null;

  const needle = term.toLowerCase();
  const actionCodes = Object.values(ActivityActionCodes).filter((code) =>
    formatActivityAction(code).toLowerCase().includes(needle)
  );
  const modules = activityModuleKeys().filter((moduleKey) =>
    formatModuleLabel(moduleKey).toLowerCase().includes(needle)
  );

  return {
    term,
    actionCodes,
    modules,
    matchMissingUserName: SYSTEM_USER_LABEL.includes(needle),
  };
}

/** PostgREST `.or()` clause. Uses `*` wildcards, which `.or()` requires. */
export function activityLogSearchOrFilter(search: ActivityLogTextSearch): string {
  const pattern = `*${search.term}*`;
  const clauses = [
    `user_name.ilike."${pattern}"`,
    `action.ilike."${pattern}"`,
    `action_code.ilike."${pattern}"`,
    `module.ilike."${pattern}"`,
  ];

  if (search.actionCodes.length > 0) {
    const list = search.actionCodes.map((code) => `"${code}"`).join(",");
    clauses.push(`action_code.in.(${list})`);
  }
  if (search.modules.length > 0) {
    const list = search.modules.map((moduleKey) => `"${moduleKey}"`).join(",");
    clauses.push(`module.in.(${list})`);
  }
  if (search.matchMissingUserName) {
    clauses.push("user_name.is.null");
  }

  return clauses.join(",");
}
