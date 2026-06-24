"use client";

import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ButtonProps & {
  loading?: boolean;
  loadingLabel: string;
  children: React.ReactNode;
};

export function SubmitButton({
  loading = false,
  loadingLabel,
  children,
  disabled,
  className,
  ...props
}: Props) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
