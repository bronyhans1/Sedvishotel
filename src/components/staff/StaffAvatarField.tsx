"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export type AvatarFieldState = {
  file: File | null;
  removeExisting: boolean;
};

type Props = {
  fullName: string;
  currentAvatarUrl?: string | null;
  value: AvatarFieldState;
  onChange: (next: AvatarFieldState) => void;
  disabled?: boolean;
};

export function StaffAvatarField({
  fullName,
  currentAvatarUrl,
  value,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const displayUrl = value.removeExisting
    ? previewUrl
    : previewUrl ?? currentAvatarUrl ?? null;

  const handleFile = (file: File | null) => {
    setError("");
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 2 MB or smaller.");
      return;
    }

    onChange({ file, removeExisting: false });
  };

  const handleRemove = () => {
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onChange({ file: null, removeExisting: true });
  };

  return (
    <div className="space-y-3">
      <Label>Avatar</Label>
      <div className="flex items-center gap-4">
        <StaffAvatar
          fullName={fullName || "Staff"}
          avatarUrl={displayUrl}
          className="h-16 w-16"
          fallbackClassName="text-base"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {currentAvatarUrl && !value.removeExisting ? "Change" : "Upload"}
          </Button>
          {(currentAvatarUrl && !value.removeExisting) || value.file ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP · max 2 MB. Stored in staff-avatars bucket.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
