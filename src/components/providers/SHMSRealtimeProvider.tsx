"use client";

import { useSHMSRealtime } from "@/hooks/use-shms-realtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  children: React.ReactNode;
  /** Realtime rollout stage (default 1). */
  stage?: 1 | 2 | 3;
};

/** Dashboard-wide realtime subscription — debounced router.refresh on DB changes. */
export function SHMSRealtimeProvider({ children, stage = 1 }: Props) {
  useSHMSRealtime({
    stage,
    enabled: isSupabaseConfigured(),
  });

  return <>{children}</>;
}
