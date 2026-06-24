"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ROOM_PHOTO_ALLOWED_EXTENSIONS,
  ROOM_PHOTO_MAX_BYTES,
} from "@/lib/room-photos/constants";
import type { RoomPhoto, RoomPhotoSource } from "@/types/room-photo";

type PhotoGalleryProps = {
  photos: RoomPhoto[];
  source: RoomPhotoSource;
  inheritedLabel?: string;
  canManage: boolean;
  maxPhotos: number;
  /** Photo count used for upload limit (defaults to photos.length) */
  uploadCount?: number;
  compact?: boolean;
  /** When set, only these photo IDs can be deleted, reordered, or set as cover */
  manageablePhotoIds?: string[];
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  onDelete: (photoId: string) => Promise<{ success: boolean; error?: string }>;
  onSetCover: (photoId: string) => Promise<{ success: boolean; error?: string }>;
  onReorder?: (photoIds: string[]) => Promise<{ success: boolean; error?: string }>;
};

function coverIndex(photos: RoomPhoto[]): number {
  const idx = photos.findIndex((p) => p.isCover);
  return idx >= 0 ? idx : 0;
}

export function PhotoGallery({
  photos,
  source,
  inheritedLabel,
  canManage,
  maxPhotos,
  uploadCount,
  compact = false,
  manageablePhotoIds,
  onUpload,
  onDelete,
  onSetCover,
  onReorder,
}: PhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => coverIndex(photos));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasPhotos = photos.length > 0;
  const ownedCount = uploadCount ?? photos.length;
  const atLimit = ownedCount >= maxPhotos;
  const cover = photos[activeIndex] ?? photos[coverIndex(photos)];
  const manageableSet = new Set(manageablePhotoIds ?? photos.map((p) => p.id));

  function canManagePhoto(photoId: string): boolean {
    return canManage && manageableSet.has(photoId);
  }

  function validateClientFile(file: File): string | null {
    if (!ROOM_PHOTO_ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )) {
      return "Use JPEG, PNG, or WebP.";
    }
    if (file.size > ROOM_PHOTO_MAX_BYTES) {
      return "Image must be 5 MB or smaller.";
    }
    return null;
  }

  function handleUpload(file: File) {
    const err = validateClientFile(file);
    if (err) return;

    startTransition(async () => {
      const result = await onUpload(file);
      if (result.success) {
        setActiveIndex(photos.length);
      }
    });
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await onDelete(photoId);
      setActiveIndex((i) => Math.max(0, i - 1));
    });
  }

  function handleSetCover(photoId: string) {
    const idx = photos.findIndex((p) => p.id === photoId);
    startTransition(async () => {
      const result = await onSetCover(photoId);
      if (result.success && idx >= 0) setActiveIndex(idx);
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || !onReorder || dragId === targetId) return;
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    startTransition(async () => {
      await onReorder(next);
    });
    setDragId(null);
  }

  if (!hasPhotos) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 bg-muted/50",
          compact ? "rounded-lg p-6" : "aspect-video"
        )}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Room photos — awaiting upload
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-24 rounded-md border border-dashed bg-muted"
            />
          ))}
        </div>
        {canManage ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending || atLimit}
              onClick={() => inputRef.current?.click()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Photos
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {inheritedLabel ? (
        <p className="text-xs text-muted-foreground">{inheritedLabel}</p>
      ) : null}

      <button
        type="button"
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-muted",
          compact ? "aspect-[16/10]" : "aspect-video"
        )}
        onClick={() => setLightboxOpen(true)}
        aria-label="Open photo viewer"
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.fileName ?? "Room photo"}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 66vw"
            unoptimized
          />
        ) : null}
        {cover?.isCover ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy">
            Cover
          </span>
        ) : null}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              draggable={canManagePhoto(photo.id) && Boolean(onReorder)}
              onDragStart={() => setDragId(photo.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(photo.id)}
              className={cn(
                "group relative shrink-0",
                dragId === photo.id && "opacity-50"
              )}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-md border-2 transition-all sm:h-20 sm:w-28",
                  i === activeIndex
                    ? "border-brand-gold ring-2 ring-brand-gold/30"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="112px"
                  unoptimized
                />
                {photo.isCover ? (
                  <Star className="absolute left-1 top-1 h-3 w-3 fill-brand-gold text-brand-gold" />
                ) : null}
              </button>
              {canManagePhoto(photo.id) ? (
                <div className="absolute -bottom-1 right-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.isCover ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      title="Set cover"
                      disabled={isPending}
                      onClick={() => handleSetCover(photo.id)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6"
                    title="Delete"
                    disabled={isPending}
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {canManage ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending || atLimit}
              onClick={() => inputRef.current?.click()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </Button>
          </>
        ) : null}
      </div>

      {source !== "none" && canManage && onReorder ? (
        <p className="text-xs text-muted-foreground">
          Drag thumbnails to reorder. Max {maxPhotos} photos.
        </p>
      ) : canManage ? (
        <p className="text-xs text-muted-foreground">Max {maxPhotos} photos.</p>
      ) : null}

      <PhotoLightbox
        images={photos.map((p, i) => ({
          url: p.url,
          alt: p.fileName ?? `Photo ${i + 1}`,
        }))}
        initialIndex={activeIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
