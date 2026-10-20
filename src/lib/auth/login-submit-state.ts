/**
 * Pure login client state transitions after signInAction settles.
 * Keeps redirect control-flow separate from auth failures.
 */

export type LoginPhase = "idle" | "authenticating" | "preparing";

export const LOGIN_PREPARING_MESSAGE =
  "Sign-in successful — preparing your workspace…";

export const LOGIN_AUTHENTICATING_LABEL = "Signing in...";

export type LoginSubmitOutcome =
  | { kind: "redirect" }
  | { kind: "auth_failure"; error: string }
  | { kind: "unexpected_success" }
  | { kind: "unknown_error"; error: string };

export type LoginClientState = {
  phase: LoginPhase;
  error: string | null;
};

/** Map a settled sign-in attempt to the next client UI state. */
export function resolveLoginClientState(
  outcome: LoginSubmitOutcome
): LoginClientState {
  switch (outcome.kind) {
    case "redirect":
    case "unexpected_success":
      return { phase: "preparing", error: null };
    case "auth_failure":
      return { phase: "idle", error: outcome.error };
    case "unknown_error":
      return { phase: "idle", error: outcome.error };
    default:
      return { phase: "idle", error: "Sign in failed." };
  }
}

export function isLoginSubmitLocked(phase: LoginPhase): boolean {
  return phase === "authenticating" || phase === "preparing";
}

export function loginButtonLabel(phase: LoginPhase): string {
  if (phase === "preparing") return LOGIN_PREPARING_MESSAGE;
  if (phase === "authenticating") return LOGIN_AUTHENTICATING_LABEL;
  return "Sign In";
}
