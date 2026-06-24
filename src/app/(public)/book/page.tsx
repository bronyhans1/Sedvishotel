import type { Metadata } from "next";
import { Suspense } from "react";

import { BookPageContent } from "@/features/public/components/BookPageContent";
import { publicMetadata } from "@/config/public-site";
import { buildPublicMetadata } from "@/lib/public-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: publicMetadata.book,
  description: "Check availability and book your stay at SEDVIS HOTEL in Ho, Volta Region, Ghana.",
  path: "/book",
});

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
