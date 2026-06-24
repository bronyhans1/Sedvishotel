/**
 * Temporary auth debugging — enable with AUTH_DEBUG=true in .env.local
 * Remove after staff profile / session issues are resolved.
 */
export function isAuthDebugEnabled(): boolean {
  return process.env.AUTH_DEBUG === "true";
}

export function authDebug(scope: string, payload: Record<string, unknown>): void {
  if (!isAuthDebugEnabled()) {
    return;
  }
  console.warn(`[AUTH_DEBUG:${scope}]`, JSON.stringify(payload, null, 2));
}
