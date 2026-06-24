import { redirect } from "next/navigation";

import { authDebug } from "@/lib/auth/debug-log";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { loadBranding } from "@/lib/branding/load-branding";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { FaviconLink } from "@/components/branding/FaviconLink";
import { DashboardShell } from "@/components/loading/DashboardShell";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SHMSRealtimeProvider } from "@/components/providers/SHMSRealtimeProvider";
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

  return (
    <BrandingProvider branding={branding}>
      <FaviconLink />
      <div className="flex min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64">
        <Sidebar permissions={currentUser?.permissions ?? []} />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <Navbar user={currentUser} />
        <main className="relative flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <SHMSRealtimeProvider stage={1}>
            <DashboardShell>{children}</DashboardShell>
          </SHMSRealtimeProvider>
        </main>
      </div>
    </div>
    </BrandingProvider>
  );
}
