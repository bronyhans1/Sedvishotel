import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { calculateBookingPricing } from "@/lib/public-booking";
import type { PublicRoom } from "@/types/public";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const sampleRoom: PublicRoom = {
  id: "room-1",
  slug: "standard-room",
  name: "Standard Room",
  categoryId: "standard-room",
  description: "Test",
  longDescription: "Test",
  capacity: 2,
  pricePerNight: 400,
  amenities: [],
  images: [],
  bedPreferences: [],
};

describe("public price visibility wiring (structural)", () => {
  it("settings UI exposes the Public Website toggle", () => {
    const source = readSrc(
      "src/features/settings/components/SettingsPageContent.tsx"
    );
    assert.equal(source.includes("Public Website"), true);
    assert.equal(source.includes("Show prices on public website"), true);
    assert.equal(source.includes("showPublicWebsitePrices"), true);
  });

  it("public pages load visibility server-side and pass showPrices", () => {
    const files = [
      "src/app/(public)/page.tsx",
      "src/app/(public)/rooms/page.tsx",
      "src/app/(public)/rooms/[slug]/page.tsx",
      "src/app/(public)/book/page.tsx",
      "src/app/(public)/booking/confirmation/page.tsx",
    ];
    for (const file of files) {
      const source = readSrc(file);
      assert.equal(
        source.includes("loadPublicPriceVisibility"),
        true,
        `${file} should load visibility`
      );
      assert.equal(
        source.includes("showPrices"),
        true,
        `${file} should pass showPrices`
      );
    }
  });

  it("shared cards and page content gate monetary JSX on showPrices", () => {
    const components = [
      "src/components/public/FeaturedRoomCard.tsx",
      "src/components/public/PublicRoomCard.tsx",
      "src/components/public/BookingSummaryCard.tsx",
      "src/features/public/components/RoomDetailContent.tsx",
      "src/features/public/components/BookPageContent.tsx",
      "src/features/public/components/BookingConfirmationContent.tsx",
      "src/features/public/components/RoomsPageContent.tsx",
    ];
    for (const file of components) {
      const source = readSrc(file);
      assert.equal(
        source.includes("showPrices"),
        true,
        `${file} should accept/use showPrices`
      );
    }

    const roomsPage = readSrc(
      "src/features/public/components/RoomsPageContent.tsx"
    );
    assert.equal(roomsPage.includes("Up to GH₵300"), true);
    assert.equal(roomsPage.includes("{showPrices ? ("), true);

    const confirmation = readSrc(
      "src/features/public/components/BookingConfirmationContent.tsx"
    );
    assert.equal(confirmation.includes("Estimated Total"), true);
    assert.equal(confirmation.includes("{showPrices ? ("), true);
  });

  it("revalidatePublicWebsite includes slug and confirmation paths", () => {
    const source = readSrc("src/lib/public/revalidate-public-website.ts");
    assert.equal(source.includes('revalidatePath("/rooms/[slug]")'), true);
    assert.equal(
      source.includes('revalidatePath("/booking/confirmation")'),
      true
    );
  });

  it("room-type actions still call revalidatePublicWebsite", () => {
    const source = readSrc("src/features/room-types/actions.ts");
    assert.equal(source.includes("revalidatePublicWebsite()"), true);
  });

  it("settings save still calls revalidatePublicWebsite", () => {
    const source = readSrc("src/features/settings/actions.ts");
    assert.equal(source.includes("revalidatePublicWebsite()"), true);
  });

  it("booking calculations still return non-zero totals when visibility is OFF", () => {
    // Presentation flag does not participate in pricing math.
    const pricing = calculateBookingPricing(
      sampleRoom,
      "2026-11-01",
      "2026-11-03",
      { currency: "GHS", taxRate: 0.15, serviceCharge: 0.05 }
    );
    assert.equal(pricing.nights, 2);
    assert.ok(pricing.subtotal > 0);
    assert.ok(pricing.taxes > 0);
    assert.ok(pricing.service > 0);
    assert.ok(pricing.total > 0);
    assert.equal(pricing.total, pricing.subtotal + pricing.taxes + pricing.service);
  });

  it("does not alter shared formatCurrency utility or POS modules", () => {
    const utils = readSrc("src/lib/utils.ts");
    assert.equal(utils.includes("showPublicWebsitePrices"), false);
    assert.equal(utils.includes("showPrices"), false);

    const visibilityHelper = readSrc(
      "src/lib/public/load-public-price-visibility.ts"
    );
    assert.equal(visibilityHelper.includes("updateHotelSettings"), false);
    assert.equal(visibilityHelper.includes(".update("), false);
  });
});
