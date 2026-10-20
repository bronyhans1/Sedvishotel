import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SupabaseHousekeepingRepository } from "@/repositories/supabase/housekeeping.repository";
import { SupabaseReservationRepository } from "@/repositories/supabase/reservation.repository";

describe("housekeeping batch repository empty sets", () => {
  it("findLatestByRoomIds returns [] without querying when roomIds is empty", async () => {
    const repo = new SupabaseHousekeepingRepository(
      new Proxy(
        {},
        {
          get() {
            throw new Error("Supabase client must not be touched for empty roomIds");
          },
        }
      ) as never
    );
    assert.deepEqual(await repo.findLatestByRoomIds([]), []);
  });

  it("listLatestCheckoutsForHousekeeping returns [] without querying when roomIds is empty", async () => {
    const repo = new SupabaseReservationRepository(
      new Proxy(
        {},
        {
          get() {
            throw new Error("Supabase client must not be touched for empty roomIds");
          },
        }
      ) as never
    );
    assert.deepEqual(await repo.listLatestCheckoutsForHousekeeping([]), []);
  });
});
