import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Native date input — no decorative icons (avoids overlap on iOS Safari). */
export const PublicDateInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, type = "date", ...props }, ref) => (
  <Input
    ref={ref}
    type={type}
    className={cn("public-date-input min-h-11 w-full", className)}
    {...props}
  />
));
PublicDateInput.displayName = "PublicDateInput";
