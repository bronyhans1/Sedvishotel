import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StaffDetailsContent } from "@/features/staff/components/StaffDetailsContent";
import { loadStaffDetailData } from "@/features/staff/load-staff-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadStaffDetailData(id);
  return {
    title: data ? data.member.fullName : "Staff",
    description: `Staff profile at ${siteConfig.name}`,
  };
}

export default async function StaffDetailsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadStaffDetailData(id);
  if (!data) notFound();

  return <StaffDetailsContent {...data} />;
}
