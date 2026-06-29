import type { Metadata } from "next";

import { ContactPageContent } from "@/features/public/components/ContactPageContent";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.contact,
  description:
    "Contact SEDVIS HOTEL in Ho, Volta Region, Ghana for reservations and guest inquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageContent />;
}
