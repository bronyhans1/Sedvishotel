"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

export const SHMS_MUTATION_EVENT = "shms:mutation";

/**
 * Refreshes the current route's server components after a mutation.
 * Broadcasts a global event so the dashboard home can refresh in place.
 * Pair with revalidatePath() in server actions for cross-page cache invalidation.
 */
export function useLiveRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SHMS_MUTATION_EVENT));
    }
    startTransition(() => {
      router.refresh();
    });
  }, [router]);
}
