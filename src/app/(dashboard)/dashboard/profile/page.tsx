import type { Metadata } from "next";

import { ProfilePageContent } from "@/features/profile/components/ProfilePageContent";
import { loadProfilePageData } from "@/features/profile/load-profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your SHMS staff profile, security, and account settings.",
};

export default async function ProfilePage() {
  const data = await loadProfilePageData();
  return <ProfilePageContent profile={data.profile} activity={data.activity} />;
}
