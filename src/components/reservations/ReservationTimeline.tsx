import {
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Circle,
  CreditCard,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReservationTimelineEvent } from "@/types/reservation";

const iconMap = {
  created: FileText,
  payment: CreditCard,
  confirmed: CheckCircle2,
  "check-in": CalendarCheck,
  "check-out": CalendarX,
};

type Props = {
  events: ReservationTimelineEvent[];
};

export function ReservationTimeline({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reservation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-0">
          {events.map((event, index) => {
            const Icon = iconMap[event.icon];
            const isLast = index === events.length - 1;
            return (
              <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                {!isLast && (
                  <span
                    className={cn(
                      "absolute left-[15px] top-8 h-full w-px",
                      event.completed ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                    event.completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {event.completed ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "font-medium",
                      !event.completed && "text-muted-foreground"
                    )}
                  >
                    {event.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {event.timestamp}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
