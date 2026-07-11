import type { MetadataRoute } from "next";

import { loadPublicRooms } from "@/lib/public/load-public-rooms";
import {
  buildStaticSitemapEntries,
  getPublicSiteUrl,
} from "@/lib/public-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const canonicalUrl = getPublicSiteUrl();
  const lastModified = new Date();
  const staticEntries = buildStaticSitemapEntries();

  let roomEntries: MetadataRoute.Sitemap = [];
  try {
    const rooms = await loadPublicRooms();
    roomEntries = rooms.map((room) => ({
      url: `${canonicalUrl}/rooms/${room.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    roomEntries = [];
  }

  return [...staticEntries, ...roomEntries];
}
