import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { RoomDetailContent } from "@/features/public/components/RoomDetailContent";
import { getPublicRoomBySlug, getRelatedRooms } from "@/lib/mock-data/public-rooms";
import { buildPublicMetadata } from "@/lib/public-seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = getPublicRoomBySlug(slug);
  return buildPublicMetadata({
    title: room ? `${room.name} | SEDVIS HOTEL` : "Room | SEDVIS HOTEL",
    description: room?.description ?? "Room details at SEDVIS HOTEL",
    path: `/rooms/${slug}`,
  });
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const room = getPublicRoomBySlug(slug);
  if (!room) notFound();

  return (
    <>
      <PublicPageHeader
        eyebrow="Room Details"
        title={room.name}
        subtitle={room.description}
      />
      <RoomDetailContent room={room} related={getRelatedRooms(slug)} />
    </>
  );
}
