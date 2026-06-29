import type { Metadata } from "next";

import { BookingConfirmationContent } from "@/features/public/components/BookingConfirmationContent";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.confirmation,
  description: "Your SEDVIS HOTEL reservation confirmation.",
  path: "/booking/confirmation",
});

export default function BookingConfirmationPage() {
  return <BookingConfirmationContent />;
}
