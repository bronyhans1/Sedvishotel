import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES,
  resolveShowPublicWebsitePrices,
} from "@/lib/public/load-public-price-visibility";

describe("resolveShowPublicWebsitePrices", () => {
  it("defaults to true when missing", () => {
    assert.equal(DEFAULT_SHOW_PUBLIC_WEBSITE_PRICES, true);
    assert.equal(resolveShowPublicWebsitePrices(undefined), true);
    assert.equal(resolveShowPublicWebsitePrices(null), true);
  });

  it("preserves explicit boolean values", () => {
    assert.equal(resolveShowPublicWebsitePrices(true), true);
    assert.equal(resolveShowPublicWebsitePrices(false), false);
  });
});
