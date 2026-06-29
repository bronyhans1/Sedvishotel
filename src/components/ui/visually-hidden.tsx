import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement>;

/** Screen-reader-only text for Radix Dialog/Sheet title requirements. */
export function VisuallyHidden({ className, ...props }: Props) {
  return <span className={cn("sr-only", className)} {...props} />;
}
