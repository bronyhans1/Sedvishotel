import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChartDataPoint } from "@/types/revenue";

type Props = {
  data: ChartDataPoint[];
  className?: string;
  /** When true, values are formatted as GH₵ amounts */
  monetary?: boolean;
};

export function SimpleBarChart({ data, className, monetary = false }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  const formatValue = (value: number) =>
    monetary ? formatCurrency(value) : value.toLocaleString("en-GH");

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((point) => (
        <div key={point.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{point.label}</span>
            <span className="text-muted-foreground">{formatValue(point.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
