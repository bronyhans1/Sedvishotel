import { Package } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductImageThumbnailProps = {
  imageUrl: string | null;
  name: string;
  className?: string;
};

export function ProductImageThumbnail({
  imageUrl,
  name,
  className,
}: ProductImageThumbnailProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground",
        className
      )}
      aria-hidden
    >
      <Package className="h-4 w-4" />
    </div>
  );
}
