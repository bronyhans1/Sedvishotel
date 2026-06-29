import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Change Password | SHMS",
  description: `Set your new password for ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <ChangePasswordForm />
    </div>
  );
}
