import { LoaderLogo } from "@/components/loading/LoaderLogo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
};

const sizeMap = {
  sm: { ring: "h-10 w-10", logo: "sm" as const, title: "text-sm", sub: "text-[10px]" },
  md: { ring: "h-14 w-14", logo: "md" as const, title: "text-base", sub: "text-xs" },
  lg: { ring: "h-20 w-20", logo: "lg" as const, title: "text-xl", sub: "text-sm" },
};

export function BrandLoader({ size = "md", className, message }: Props) {
  const s = sizeMap[size];

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4", className)}
      role="status"
      aria-live="polite"
      aria-label={message ?? "Loading"}
    >
      <div className="relative">
        <div
          className={cn(
            "rounded-full border-2 border-brand-gold/20",
            s.ring
          )}
        />
        <div
          className={cn(
            "absolute inset-0 animate-shms-spin rounded-full border-2 border-transparent border-t-brand-gold",
            s.ring
          )}
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            s.ring
          )}
        >
          <LoaderLogo size={s.logo} />
        </div>
      </div>
      <div className="text-center">
        <p className={cn("font-bold tracking-wide text-foreground", s.title)}>
          {siteConfig.name}
        </p>
        <p className={cn("font-semibold uppercase tracking-[0.2em] text-brand-gold", s.sub)}>
          {siteConfig.shortName}
        </p>
        {message ? (
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
