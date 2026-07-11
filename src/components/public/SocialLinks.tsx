import type { PublicSocialLink } from "@/config/public-site";
import { cn } from "@/lib/utils";

type Props = {
  links: readonly PublicSocialLink[];
  className?: string;
  iconClassName?: string;
};

function SocialIcon({
  platform,
  className,
}: {
  platform: PublicSocialLink["platform"];
  className?: string;
}) {
  const shared = className ?? "h-4 w-4";

  switch (platform) {
    case "facebook":
      return (
        <svg
          className={shared}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.022 10.125 11.926v-8.43H7.078v-3.496h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.496h-2.796v8.43C19.612 23.095 24 18.1 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          className={shared}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.427.403a4.92 4.92 0 0 1 1.67 1.087 4.92 4.92 0 0 1 1.087 1.67c.163.457.349 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.087 1.67 4.92 4.92 0 0 1-1.67 1.087c-.457.163-1.257.349-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.67-1.087 4.92 4.92 0 0 1-1.087-1.67c-.163-.457-.349-1.257-.403-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.087-1.67 4.92 4.92 0 0 1 1.67-1.087c.457-.163 1.257-.349 2.427-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.622c-3.15 0-3.516.012-4.75.069-1.02.047-1.574.218-1.942.363-.489.19-.838.417-1.205.784-.367.367-.594.716-.784 1.205-.145.368-.316.922-.363 1.942-.057 1.234-.069 1.6-.069 4.75s.012 3.516.069 4.75c.047 1.02.218 1.574.363 1.942.19.489.417.838.784 1.205.367.367.716.594 1.205.784.368.145.922.316 1.942.363 1.234.057 1.6.069 4.75.069s3.516-.012 4.75-.069c1.02-.047 1.574-.218 1.942-.363.489-.19.838-.417 1.205-.784.367-.367.594-.716.784-1.205.145-.368.316-.922.363-1.942.057-1.234.069-1.6.069-4.75s-.012-3.516-.069-4.75c-.047-1.02-.218-1.574-.363-1.942a3.18 3.18 0 0 0-.784-1.205 3.18 3.18 0 0 0-1.205-.784c-.368-.145-.922-.316-1.942-.363-1.234-.057-1.6-.069-4.75-.069zm0 3.351a5.864 5.864 0 1 1 0 11.728 5.864 5.864 0 0 1 0-11.728zm0 1.622a4.242 4.242 0 1 0 0 8.484 4.242 4.242 0 0 0 0-8.484zm6.406-4.845a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          className={shared}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
      );
  }
}

export function SocialLinks({ links, className, iconClassName }: Props) {
  return (
    <div
      className={cn(
        "flex flex-row flex-nowrap items-center gap-3.5",
        className
      )}
    >
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-brand-gold hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
        >
          <SocialIcon platform={link.platform} className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
