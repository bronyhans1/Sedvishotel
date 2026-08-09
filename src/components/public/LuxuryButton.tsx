import Link from "next/link";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "hero-outline";

type Props = {
  href?: string;
  label?: string;
  variant?: Variant;
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
};

/**
 * Premium public CTA — slight lift, soft shadow, gold brightens on hover.
 * Same routing surface as PublicBookButton (booking flow unchanged).
 */
export function LuxuryButton({
  href = "/book",
  label = "Book Now",
  variant = "primary",
  size = "default",
  className,
  showIcon = false,
}: Props) {
  const styles: Record<Variant, string> = {
    primary:
      "border border-brand-gold/30 bg-brand-gold text-brand-navy shadow-[0_10px_28px_-12px_rgba(201,162,39,0.55)] hover:bg-[#d4af37] hover:shadow-[0_14px_32px_-12px_rgba(201,162,39,0.65)]",
    secondary:
      "bg-brand-navy text-white shadow-md hover:bg-brand-navy/90 hover:shadow-lg",
    outline:
      "border-brand-navy/30 text-brand-navy hover:border-brand-gold/50 hover:bg-brand-navy/5",
    "hero-outline":
      "border-white/45 bg-white/8 text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm hover:border-brand-gold/60 hover:bg-white/16 hover:text-white",
  };

  return (
    <Button
      asChild
      size={size}
      variant={
        variant === "outline" || variant === "hero-outline" ? "outline" : "default"
      }
      className={cn(styles[variant], "public-btn-lift", className)}
    >
      <Link href={href}>
        {showIcon ? <Calendar className="h-4 w-4" /> : null}
        {label}
      </Link>
    </Button>
  );
}
