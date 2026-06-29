import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Staff Portal",
  robots: { index: false, follow: false },
};

/** Staff portal entry — redirects to SHMS login (not linked from public site). */
export default function AdminEntryPage() {
  redirect("/login");
}
