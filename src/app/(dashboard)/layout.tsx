import { redirect } from "next/navigation";

import { authDebug } from "@/lib/auth/debug-log";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { loadBranding } from "@/lib/branding/load-branding";
import { getCurrencyConfig } from "@/lib/currency/get-currency-config";
import { setRuntimeCurrencyConfig } from "@/lib/currency/format";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { FaviconLink } from "@/components/branding/FaviconLink";
import { DashboardShell } from "@/components/loading/DashboardShell";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { HandoverReviewGate } from "@/features/shift-handover/components/HandoverReviewGate";
import {
  loadPendingHandoverAcknowledgement,
  loadShiftHandoverAttentionCount,
} from "@/features/shift-handover/load-shift-handover-page";
import { loadNavbarNotifications } from "@/lib/notifications/load-navbar-notifications";
import { SHMSRealtimeProvider } from "@/components/providers/SHMSRealtimeProvider";
import { isDashboardBlockedWithoutSupabase } from "@/lib/auth/dev-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSupabaseRequired } from "@/lib/supabase/production-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseRequired()) {
    redirect("/login?error=configuration");
  }

  if (isDashboardBlockedWithoutSupabase()) {
    redirect("/login?error=configuration");
  }

  let currentUser: CurrentUser | null = null;

  if (isSupabaseConfigured()) {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      authDebug("dashboard.layout.redirect", {
        reason: "no_staff_session",
        to: "/login",
        note: "auth cookie may exist but buildSession failed — check AUTH_DEBUG logs",
      });
      redirect("/login?error=staff_profile");
    }

    if (currentUser.mustChangePassword) {
      redirect("/change-password");
    }
  }

  const branding = await loadBranding();
  const currencyConfig = await getCurrencyConfig();
  setRuntimeCurrencyConfig(currencyConfig);
  const notifications = currentUser ? await loadNavbarNotifications() : [];
  const [shiftHandoverAttention, pendingHandoverReview] = currentUser
    ? await Promise.all([
        loadShiftHandoverAttentionCount(),
        loadPendingHandoverAcknowledgement(),
      ])
    : [0, null];

  const navBadges: Record<string, string> =
    shiftHandoverAttention > 0
      ? { "/dashboard/shift-handover": String(shiftHandoverAttention) }
      : {};

  return (
    <BrandingProvider branding={branding}>
      <CurrencyProvider config={currencyConfig}>
      <FaviconLink />
      {pendingHandoverReview ? (
        <HandoverReviewGate
          shift={pendingHandoverReview.shift}
          pendingTasks={pendingHandoverReview.pendingTasks}
          openIssues={pendingHandoverReview.openIssues}
        />
      ) : null}
      <div className="flex min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64">
        <Sidebar
          permissions={currentUser?.permissions ?? []}
          navBadges={navBadges}
        />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <Navbar user={currentUser} notifications={notifications} navBadges={navBadges} />
        <main className="relative flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <SHMSRealtimeProvider stage={1}>
            <DashboardShell>{children}</DashboardShell>
          </SHMSRealtimeProvider>
        </main>
      </div>
    </div>
    </CurrencyProvider>
    </BrandingProvider>
  );
}
