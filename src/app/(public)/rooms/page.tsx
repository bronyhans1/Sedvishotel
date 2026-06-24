import type { Metadata } from "next";

import { RoomsPageContent } from "@/features/public/components/RoomsPageContent";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.rooms,
  description:
    "Browse thoughtfully designed accommodations at SEDVIS HOTEL — Standard Room and Deluxe Room. Best rates when you book direct.",
  path: "/rooms",
});

export default function RoomsPage() {
  return <RoomsPageContent />;
}
