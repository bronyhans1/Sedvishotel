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

const labels = {
  book: "Book Now",
  reserve: "Reserve This Room",
  bookRoom: "Book This Room",
  plan: "Plan Your Stay",
  experience: "Book Your Experience",
  reserveRoom: "Reserve A Room",
};

export function PublicBookButton({
  href = "/book",
  label = labels.book,
  variant = "primary",
  size = "default",
  className,
  showIcon = false,
}: Props) {
  const styles: Record<Variant, string> = {
    primary:
      "border border-brand-gold/30 bg-brand-gold text-brand-navy shadow-[0_10px_28px_-12px_rgba(201,162,39,0.55)] hover:bg-[#d4af37] hover:shadow-[0_14px_32px_-12px_rgba(201,162,39,0.65)] transition-all",
    secondary: "bg-brand-navy text-white hover:bg-brand-navy/90 shadow-md hover:shadow-lg",
    outline: "border-brand-navy text-brand-navy hover:bg-brand-navy/5",
    "hero-outline": "border-white/40 bg-white/5 text-white hover:bg-white/15",
  };

  return (
    <Button
      asChild
      size={size}
      variant={variant === "outline" || variant === "hero-outline" ? "outline" : "default"}
      className={cn(styles[variant], "public-btn-lift", className)}
    >
      <Link href={href}>
        {showIcon && <Calendar className="h-4 w-4" />}
        {label}
      </Link>
    </Button>
  );
}

export const bookLabels = labels;
