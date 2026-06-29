import type { Metadata } from "next";

import { ReservationLookupContent } from "@/features/public/components/ReservationLookupContent";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { publicMetadata } from "@/config/public-site";
import { loadHotelContactSettings } from "@/lib/settings/contact-settings";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.lookup,
  description: "Look up your SEDVIS HOTEL reservation status online.",
  path: "/reservation-lookup",
});

export default async function ReservationLookupPage() {
  const contactSettings = await loadHotelContactSettings();

  return (
    <>
      <ReservationLookupContent contactSettings={contactSettings} />
      <div className="border-t py-12">
        <PublicPageCTAs />
      </div>
    </>
  );
}
