import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("login transition wiring", () => {
  it("LoginForm does not clear pending state in finally on every path", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/features/auth/components/LoginForm.tsx"),
      "utf8"
    );
    assert.equal(source.includes("finally"), false);
    assert.equal(source.includes("isRedirectError"), true);
    assert.equal(source.includes("preparing"), true);
    assert.equal(source.includes("SHMSOverlayLoader"), true);
    assert.equal(
      source.includes("Sign-in successful — preparing your workspace"),
      false
    );
    // Message comes from shared constant import
    assert.equal(source.includes("LOGIN_PREPARING_MESSAGE"), true);
  });

  it("dashboard layout parallelizes independent shell loads after auth", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/(dashboard)/layout.tsx"),
      "utf8"
    );
    assert.equal(source.includes("await getCurrentUser()"), true);
    assert.equal(source.includes("Promise.all(["), true);
    assert.equal(source.includes("loadBranding()"), true);
    assert.equal(source.includes("getCurrencyConfig()"), true);
    assert.equal(source.includes("loadNavbarNotifications()"), true);
    // Branding must not block alone before notifications in a serial chain
    const brandingIdx = source.indexOf("loadBranding()");
    const promiseAllIdx = source.indexOf("Promise.all([");
    assert.ok(promiseAllIdx > 0);
    assert.ok(brandingIdx > promiseAllIdx);
  });

  it("service context and current user use request-scoped cached session", () => {
    const serviceContext = readFileSync(
      path.join(process.cwd(), "src/lib/auth/service-context.ts"),
      "utf8"
    );
    const currentUser = readFileSync(
      path.join(process.cwd(), "src/lib/auth/current-user.ts"),
      "utf8"
    );
    assert.equal(serviceContext.includes("getCachedAuthSession"), true);
    assert.equal(currentUser.includes("getCachedAuthSession"), true);
    assert.equal(currentUser.includes("cache("), true);
  });
});
