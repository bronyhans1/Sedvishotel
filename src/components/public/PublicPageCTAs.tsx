import Link from "next/link";

import { PublicBookButton } from "@/components/public/PublicBookButton";
import { Button } from "@/components/ui/button";

type Props = {
  primaryLabel?: string;
  primaryHref?: string;
  className?: string;
};

export function PublicPageCTAs({
  primaryLabel,
  primaryHref = "/book",
  className,
}: Props) {
  return (
    <div
      className={`flex w-full max-w-full flex-wrap items-stretch justify-center gap-3 sm:items-center sm:gap-4 ${className ?? ""}`}
    >
      <PublicBookButton label={primaryLabel} href={primaryHref} size="lg" />
      <Button
        variant="outline"
        size="lg"
        asChild
        className="min-h-11 w-full sm:w-auto public-btn-lift border-brand-navy/30"
      >
        <Link href="/contact">Contact Us</Link>
      </Button>
    </div>
  );
}
