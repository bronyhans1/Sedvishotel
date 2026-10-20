import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isLoginSubmitLocked,
  loginButtonLabel,
  LOGIN_AUTHENTICATING_LABEL,
  LOGIN_PREPARING_MESSAGE,
  resolveLoginClientState,
} from "@/lib/auth/login-submit-state";

describe("login submit client state", () => {
  it("enters preparing on redirect control-flow (successful navigation)", () => {
    const next = resolveLoginClientState({ kind: "redirect" });
    assert.equal(next.phase, "preparing");
    assert.equal(next.error, null);
  });

  it("does not treat redirect as an authentication failure", () => {
    const next = resolveLoginClientState({ kind: "redirect" });
    assert.notEqual(next.phase, "idle");
    assert.equal(next.error, null);
  });

  it("restores idle with error on invalid credentials", () => {
    const next = resolveLoginClientState({
      kind: "auth_failure",
      error: "Invalid email or password.",
    });
    assert.equal(next.phase, "idle");
    assert.equal(next.error, "Invalid email or password.");
  });

  it("locks submit while authenticating or preparing", () => {
    assert.equal(isLoginSubmitLocked("idle"), false);
    assert.equal(isLoginSubmitLocked("authenticating"), true);
    assert.equal(isLoginSubmitLocked("preparing"), true);
  });

  it("uses preparing / signing-in labels appropriately", () => {
    assert.equal(loginButtonLabel("idle"), "Sign In");
    assert.equal(loginButtonLabel("authenticating"), LOGIN_AUTHENTICATING_LABEL);
    assert.equal(loginButtonLabel("preparing"), LOGIN_PREPARING_MESSAGE);
  });

  it("keeps preparing on unexpected success return without clearing to idle", () => {
    const next = resolveLoginClientState({ kind: "unexpected_success" });
    assert.equal(next.phase, "preparing");
  });
});
