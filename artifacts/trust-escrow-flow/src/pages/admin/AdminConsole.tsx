import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoBackendNotice, TradeStateBadge } from "@/components/demo/DemoIndicators";
import { PaymentInstructionsEditor } from "@/components/admin/PaymentInstructionsEditor";
import { useDemoBackend, useDemoCounterparties } from "@/hooks/use-demo-market";
import {
  useAdminActions,
  useAdminNotifications,
  useAdminOverview,
  useAdminTrades,
  useIsAdmin,
  usePaymentInstructions,
  useResetDemo,
} from "@/hooks/use-admin";
import { useKycDocumentUrl, useKycQueue, useReviewKyc } from "@/hooks/use-kyc";
import { formatAssetAmount, formatMoney, type Currency } from "@/lib/pricing";
import {
  type DemoCounterparty,
  type KycSubmission,
} from "@/integrations/supabase/demo";

function when(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function AdminConsole() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: backend, isLoading: backendLoading } = useDemoBackend();

  if (adminLoading || backendLoading) {
    return (
      <div className="container flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (backend && backend.status !== "ready") {
    return (
      <div className="container max-w-2xl py-12">
        <DemoBackendNotice state={backend} />
      </div>
    );
  }

  // Note: this only hides the UI. Every query and RPC below is independently
  // gated by RLS and require_admin(), so a non-admin who bypasses this render
  // path still receives empty result sets and permission errors.
  if (!isAdmin) {
    return (
      <div className="container flex flex-col items-center gap-3 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="font-display text-xl font-bold text-foreground">Operator access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This console is restricted to accounts holding the admin role.
        </p>
      </div>
    );
  }

  return <Console />;
}

function Console() {
  const overview = useAdminOverview();
  const reset = useResetDemo();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = async () => {
    try {
      const result = await reset.mutateAsync();
      toast.success(
        `Environment reset - ${result.trades_cleared} trades and ${result.kyc_cleared} applications cleared.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setConfirmReset(false);
    }
  };

  const o = overview.data;

  return (
    <div className="container py-8">
      <SEOHead title="Operator Console - P2PxBT" description="Operations console." noindex />

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Operator Console</h1>
          <p className="text-sm text-muted-foreground">
            Operational view over the P2PxBT marketplace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset environment
        </Button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Pending KYC" value={o?.pendingKyc} />
        <Metric label="Active trades" value={o?.activeTrades} />
        <Metric label="Payment requests" value={o?.paymentRequests} highlight />
        <Metric label="Unread alerts" value={o?.unreadNotifications} />
        <Metric label="Completed" value={o?.completedTrades} />
      </div>

      <Tabs defaultValue="kyc">
        <TabsList className="flex-wrap">
          <TabsTrigger value="kyc">KYC Applications</TabsTrigger>
          <TabsTrigger value="active">Active Trades</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="mirrors">Seller Mirrors</TabsTrigger>
          <TabsTrigger value="activity">Admin Activity</TabsTrigger>
          <TabsTrigger value="alerts">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc" className="mt-4"><KycQueue /></TabsContent>
        <TabsContent value="active" className="mt-4"><TradesTable filter="active" /></TabsContent>
        <TabsContent value="completed" className="mt-4"><TradesTable filter="completed" /></TabsContent>
        <TabsContent value="mirrors" className="mt-4"><SellerMirrors /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityLog /></TabsContent>
        <TabsContent value="alerts" className="mt-4"><NotificationsList /></TabsContent>
      </Tabs>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the environment?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every trade, chat message, timeline event, KYC application and
              notification, and returns all accounts to unverified. Seeded counterparties and offers
              are restored. Signed-up accounts themselves are kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset environment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value ? "border-amber-500/40" : undefined}>
      <CardContent className="p-4">
        <p className="text-2xl font-bold text-foreground">{value ?? "-"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── KYC queue ───────────────────────────────────────────────────────────────

function KycQueue() {
  const { data: submissions = [], isLoading } = useKycQueue();
  const review = useReviewKyc();
  const docUrl = useKycDocumentUrl();
  const [rejecting, setRejecting] = useState<KycSubmission | null>(null);
  const [reason, setReason] = useState("");

  const viewDocument = async (fileReference: string) => {
    try {
      const url = await docUrl.mutateAsync(fileReference);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open that document.");
    }
  };

  const approve = async (submission: KycSubmission) => {
    try {
      await review.mutateAsync({ submissionId: submission.id, approve: true });
      toast.success("Application approved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed.");
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    try {
      await review.mutateAsync({
        submissionId: rejecting.id,
        approve: false,
        rejectionReason: reason,
      });
      toast.success("Application rejected.");
      setRejecting(null);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed.");
    }
  };

  if (isLoading) return <Loading />;
  if (submissions.length === 0) return <Empty text="No KYC applications yet." />;

  return (
    <>
      <TableShell headers={["Applicant", "Documents", "Submitted", "Status", ""]}>
        {submissions.map((s) => {
          // The wizard files three documents; older submissions carry one.
          const docs = [
            { label: "National ID", path: s.national_id_path },
            { label: "Proof of Address", path: s.utility_bill_path },
            { label: "Selfie", path: s.selfie_path },
            { label: s.document_type?.replace(/_/g, " ") ?? "Document", path: s.file_reference },
          ].filter((d): d is { label: string; path: string } => !!d.path);

          return (
            <TableRow key={s.id}>
              <TableCell className="align-top">
                <p className="font-medium text-foreground">{s.full_name ?? "-"}</p>
                <dl className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {s.date_of_birth && (
                    <div>
                      <dt className="inline">DOB: </dt>
                      <dd className="inline">{s.date_of_birth}</dd>
                    </div>
                  )}
                  {(s.address_line1 || s.city) && (
                    <div className="max-w-[16rem]">
                      <dt className="inline">Address: </dt>
                      <dd className="inline">
                        {[s.address_line1, s.address_line2, s.city, s.postal_code, s.country]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex flex-wrap gap-1.5">
                  {docs.map((d) => (
                    <Button
                      key={d.path}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => viewDocument(d.path)}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      {d.label}
                    </Button>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{when(s.submitted_at)}</TableCell>
              <TableCell>
                <Badge variant="outline">{s.status}</Badge>
                {s.rejection_reason && (
                  <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                    {s.rejection_reason}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {s.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => approve(s)} disabled={review.isPending}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejecting(s)}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableShell>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              The applicant sees this reason and can resubmit.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Document is not legible"
            maxLength={300}
          />
          <Button onClick={reject} disabled={!reason.trim() || review.isPending}>
            Reject application
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Trades ──────────────────────────────────────────────────────────────────

function TradesTable({ filter }: { filter: "active" | "completed" }) {
  const { data: trades = [], isLoading } = useAdminTrades(filter);

  if (isLoading) return <Loading />;
  if (trades.length === 0) return <Empty text={`No ${filter} trades.`} />;

  return (
    <TableShell
      headers={[
        "Trade ID", "User", "Counterparty", "Asset", "Amount",
        "Value", "Payment", "KYC", "Status", "Last activity", "",
      ]}
    >
      {trades.map((t) => (
        <TableRow key={t.id}>
          <TableCell className="font-mono text-xs">{t.trade_ref}</TableCell>
          <TableCell className="text-sm">{t.owner?.username ?? "-"}</TableCell>
          <TableCell className="text-sm">{t.counterparty?.display_name ?? "-"}</TableCell>
          <TableCell className="text-sm">{t.asset}</TableCell>
          <TableCell className="font-mono text-xs">
            {formatAssetAmount(t.amount, t.asset)}
          </TableCell>
          <TableCell className="font-mono text-xs">{formatMoney(t.total, t.currency as Currency)}</TableCell>
          <TableCell className="text-xs">{t.payment_method}</TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px]">
              {t.owner?.kyc_status ?? "-"}
            </Badge>
          </TableCell>
          <TableCell><TradeStateBadge state={t.demo_state} /></TableCell>
          <TableCell className="text-xs text-muted-foreground">{when(t.last_activity_at)}</TableCell>
          <TableCell>
            <Button asChild size="sm" variant="outline">
              <Link to={`/admin/trade/${t.id}`}>
                Open <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableShell>
  );
}

// ── Seller mirrors ──────────────────────────────────────────────────────────

function SellerMirrors() {
  const { data: counterparties = [], isLoading } = useDemoCounterparties();
  const [open, setOpen] = useState<DemoCounterparty | null>(null);

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {counterparties.map((cp) => (
          <Card key={cp.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-base">{cp.display_name}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{cp.kind}</Badge>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{cp.id}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="text-foreground">Mirror:</span> {cp.admin_mirror_label} (
                {cp.admin_mirror_id})
              </p>
              <p>
                <span className="text-foreground">Assets:</span> {cp.supported_assets.join(", ")}
              </p>
              <p>
                <span className="text-foreground">Methods:</span> {cp.payment_methods.join(", ")}
              </p>
              <p>
                {cp.rating.toFixed(1)}★ · {cp.completion_rate.toFixed(1)}% ·{" "}
                {cp.trade_count.toLocaleString()} trades
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(cp)}>
                Open seller mirror
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SellerMirrorDialog counterparty={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function SellerMirrorDialog({
  counterparty,
  onClose,
}: {
  counterparty: DemoCounterparty | null;
  onClose: () => void;
}) {
  const { data: instructions = [] } = usePaymentInstructions(counterparty?.id);

  if (!counterparty) return null;

  return (
    <Dialog open={!!counterparty} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            {counterparty.display_name}
            
          </DialogTitle>
          <DialogDescription>
            Operated by {counterparty.admin_mirror_label} · {counterparty.admin_mirror_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <dl className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <MirrorRow label="Identifier" value={counterparty.id} mono />
            <MirrorRow label="Kind" value={counterparty.kind} />
            <MirrorRow label="Assets" value={counterparty.supported_assets.join(", ")} />
            <MirrorRow label="Payment methods" value={counterparty.payment_methods.join(", ")} />
            <MirrorRow label="Rating" value={`${counterparty.rating.toFixed(1)} / 5.0`} />
            <MirrorRow label="Completion" value={`${counterparty.completion_rate.toFixed(1)}%`} />
            <MirrorRow label="Trades" value={counterparty.trade_count.toLocaleString()} />
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Payment instructions</h3>
            <PaymentInstructionsEditor counterparty={counterparty} instructions={instructions} />
            <p className="mt-3 text-xs text-muted-foreground">
              Only operators can read these. They reach a buyer when an operator sends them into
              the trade chat.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MirrorRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

// ── Activity + notifications ────────────────────────────────────────────────

function ActivityLog() {
  const { data: actions = [], isLoading } = useAdminActions();
  if (isLoading) return <Loading />;
  if (actions.length === 0) return <Empty text="No operator actions recorded yet." />;

  return (
    <TableShell headers={["Time", "Action", "Trade", "Details"]}>
      {actions.map((a) => (
        <TableRow key={a.id}>
          <TableCell className="text-xs text-muted-foreground">{when(a.created_at)}</TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
          </TableCell>
          <TableCell className="font-mono text-xs">
            {a.trade_id ? (
              <Link to={`/admin/trade/${a.trade_id}`} className="text-primary hover:underline">
                {String(a.metadata?.trade_ref ?? a.trade_id.slice(0, 8))}
              </Link>
            ) : (
              "-"
            )}
          </TableCell>
          <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
            {Object.entries(a.metadata ?? {})
              .filter(([k]) => k !== "trade_ref")
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" · ") || "-"}
          </TableCell>
        </TableRow>
      ))}
    </TableShell>
  );
}

function NotificationsList() {
  const { data: notifications = [], isLoading } = useAdminNotifications();
  if (isLoading) return <Loading />;
  if (notifications.length === 0) return <Empty text="No notifications." />;

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Card key={n.id} className={n.status === "UNREAD" ? "border-amber-500/40" : undefined}>
          <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{n.title}</p>
                <Badge variant="outline" className="text-[10px]">{n.status}</Badge>
                {n.email_sent_at && (
                  <Badge variant="secondary" className="text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Emailed
                  </Badge>
                )}
              </div>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{when(n.created_at)}</p>
            </div>
            {n.trade_id && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/trade/${n.trade_id}`}>Open trade</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function TableShell({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={`${h}-${i}`}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
