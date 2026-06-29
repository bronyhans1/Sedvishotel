"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SHMS_MUTATION_EVENT } from "@/hooks/use-live-refresh";
import { createBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type RealtimeStage = 1 | 2 | 3;

type Options = {
  stage?: RealtimeStage;
  enabled?: boolean;
};

const STAGE_TABLES: Record<RealtimeStage, string[]> = {
  1: ["notifications", "reservations", "rooms", "payments"],
  2: [
    "notifications",
    "reservations",
    "rooms",
    "payments",
    "housekeeping_tasks",
    "activity_logs",
  ],
  3: [
    "notifications",
    "reservations",
    "rooms",
    "payments",
    "housekeeping_tasks",
    "activity_logs",
    "guests",
    "invoices",
  ],
};

/**
 * Subscribes to Supabase Realtime postgres changes and refreshes the current route.
 * Stage 1: notifications, dashboard widgets, occupancy, check-in/out queues.
 */
export function useSHMSRealtime({ stage = 1, enabled = true }: Options = {}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;

    let debounceId: number | undefined;
    const supabase = createBrowserClient();
    const tables = STAGE_TABLES[stage];
    const channel = supabase.channel(`shms-realtime-stage-${stage}`);

    const scheduleRefresh = () => {
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        window.dispatchEvent(new Event(SHMS_MUTATION_EVENT));
        router.refresh();
      }, 400);
    };

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      void supabase.removeChannel(channel);
    };
  }, [enabled, router, stage]);
}
