import type { Metadata } from "next";

import { FloorDetailsContent } from "@/features/floors/components/FloorDetailsContent";
import { loadFloorDetail } from "@/features/floors/load-floor-detail";
import { siteConfig } from "@/config/site";

type FloorDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: FloorDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const { floor } = await loadFloorDetail(id);
    return {
      title: floor.name,
      description: `${floor.name} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Floor Not Found" };
  }
}

export default async function FloorDetailsPage({ params }: FloorDetailsPageProps) {
  const { id } = await params;
  const { floor, access } = await loadFloorDetail(id);
  return <FloorDetailsContent floor={floor} access={access} />;
}
