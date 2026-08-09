import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { RoomDetailContent } from "@/features/public/components/RoomDetailContent";
import {
  getPublicRoomBySlug,
  getRelatedRooms,
  loadPublicRooms,
} from "@/lib/public/load-public-rooms";
import {
  getRoomsPageGallery,
  parseRoomsPageGalleryId,
  ROOMS_PAGE_GALLERY_QUERY,
} from "@/lib/public/rooms-page-images";
import { buildPublicMetadata } from "@/lib/public-seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rooms = await loadPublicRooms();
  const room = getPublicRoomBySlug(rooms, slug);
  return buildPublicMetadata({
    title: room ? `${room.name} | SEDVIS HOTEL` : "Room | SEDVIS HOTEL",
    description: room?.description ?? "Room details at SEDVIS HOTEL",
    path: `/rooms/${slug}`,
  });
}

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const galleryId = parseRoomsPageGalleryId(query[ROOMS_PAGE_GALLERY_QUERY]);

  const rooms = await loadPublicRooms();
  const room = getPublicRoomBySlug(rooms, slug);
  if (!room) notFound();

  const galleryImages = getRoomsPageGallery(room.slug, galleryId);
  const roomForDisplay = {
    ...room,
    images: galleryImages.length ? galleryImages : room.images,
  };

  return (
    <>
      <PublicPageHeader
        eyebrow="Room Details"
        title={room.name}
        subtitle={room.description}
      />
      <RoomDetailContent
        room={roomForDisplay}
        related={getRelatedRooms(rooms, slug)}
        catalogRooms={rooms}
      />
    </>
  );
}
