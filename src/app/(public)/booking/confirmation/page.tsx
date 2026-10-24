import type { Metadata } from "next";

import { BookingConfirmationContent } from "@/features/public/components/BookingConfirmationContent";
import { publicMetadata } from "@/config/public-site";
import { loadPublicPriceVisibility } from "@/lib/public/load-public-price-visibility";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = {
  ...buildPublicMetadata({
    title: publicMetadata.confirmation,
    description: "Your SEDVIS HOTEL reservation confirmation.",
    path: "/booking/confirmation",
  }),
  robots: { index: false, follow: false },
};

export default async function BookingConfirmationPage() {
  const showPrices = await loadPublicPriceVisibility();
  return <BookingConfirmationContent showPrices={showPrices} />;
}
