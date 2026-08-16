import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  labelForEvent,
  HAPPY_PATH,
  STATE_LABELS,
  happyPathIndex,
  type TradeState,
} from "@/lib/trade-state-machine";
import type { TradeEvent } from "@/integrations/supabase/demo";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Horizontal progress rail across the happy path. */
export function TradeProgressRail({ state }: { state: TradeState }) {
  const current = happyPathIndex(state);
  const offRail = current === -1;

  return (
    <ol className="flex items-center gap-1" aria-label="Trade progress">
      {HAPPY_PATH.map((step, i) => {
        const done = !offRail && i < current;
        const active = !offRail && i === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-1">
            <span
              title={STATE_LABELS[step]}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                done && "bg-primary",
                active && "bg-primary/60",
                !done && !active && "bg-muted",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}

export function TradeTimeline({ events }: { events: TradeEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">Trade timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-0">
            {events.map((event, i) => {
              const isLast = i === events.length - 1;
              return (
                <li key={event.id} className="flex gap-3">
                  {/* Rail */}
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                        isLast
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isLast ? <Check className="h-3 w-3" /> : <Circle className="h-1.5 w-1.5 fill-current" />}
                    </span>
                    {!isLast && <span className="my-0.5 w-px flex-1 bg-border" />}
                  </div>

                  <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <time
                        dateTime={event.created_at}
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {timeOf(event.created_at)}
                      </time>
                      <span className="text-sm text-foreground">
                        {labelForEvent(event.event_type)}
                      </span>
                    </div>
                    {event.actor_role !== "system" && (
                      <p className="text-xs capitalize text-muted-foreground">
                        by {event.actor_role === "admin" ? "P2PxBT operator" : event.actor_role}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
