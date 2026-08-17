import { TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REQUIRED_MIGRATIONS, type DemoBackendState } from "@/lib/demo-backend";
import {
  STATE_LABELS,
  STATE_TONES,
  type TradeState,
  type StateTone,
} from "@/lib/trade-state-machine";

const TONE_CLASSES: Record<StateTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  progress: "border-primary/25 bg-primary/10 text-primary",
  attention: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function TradeStateBadge({
  state,
  className,
}: {
  state: TradeState;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(TONE_CLASSES[STATE_TONES[state]], "font-medium", className)}>
      {STATE_LABELS[state]}
    </Badge>
  );
}

/**
 * Shown when the migrations have not been applied to the linked Supabase
 * project. Without this the app would surface raw PostgREST errors. This is a
 * setup-time diagnostic for whoever provisions the environment, not a surface
 * a signed-in trader is expected to reach.
 */
export function DemoBackendNotice({
  state,
  onRetry,
}: {
  state: DemoBackendState;
  onRetry?: () => void;
}) {
  if (state.status === "ready") return null;

  const isMissing = state.status === "not-provisioned";

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.04]">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isMissing ? "Backend not provisioned" : "Connection issue"}
          </h2>
        </div>

        {isMissing ? (
          <>
            <p className="text-sm text-muted-foreground">
              The schema has not been applied to this Supabase project yet. Apply the migrations
              below, then reload.
            </p>
            <ol className="space-y-1 rounded-md border border-border bg-background/60 p-3 font-mono text-xs text-muted-foreground">
              {REQUIRED_MIGRATIONS.map((m, i) => (
                <li key={m}>
                  <span className="text-foreground/50">{i + 1}.</span> {m}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              See <span className="font-mono">docs/DEMO_SETUP.md</span> for the runbook.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {state.message ?? "Could not reach the marketplace. Check your connection and try again."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
