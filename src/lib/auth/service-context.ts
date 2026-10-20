import { redirect } from "next/navigation";

import { getCachedAuthSession } from "@/lib/auth/cached-session";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { AuthSession } from "@/services/auth.service";

export async function getAuthenticatedSession(): Promise<AuthSession> {
  const session = await getCachedAuthSession();
  if (!session) {
    throw new ServiceError("Unauthorized", "UNAUTHORIZED", 401);
  }
  return session;
}

/** For server page loaders — redirects to login instead of throwing. */
export async function getServiceContextForPage(): Promise<{
  session: AuthSession;
  ctx: ServiceContext;
}> {
  const session = await getCachedAuthSession();
  if (!session) {
    redirect("/login");
  }
  return { session, ctx: toServiceContext(session) };
}

export function toServiceContext(session: AuthSession): ServiceContext {
  return {
    userId: session.userId,
    roleId: session.roleId,
  };
}

export async function getServiceContext(): Promise<{
  session: AuthSession;
  ctx: ServiceContext;
}> {
  const session = await getAuthenticatedSession();
  return { session, ctx: toServiceContext(session) };
}
