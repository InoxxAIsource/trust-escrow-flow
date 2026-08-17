import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, ShieldAlert } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoBackendNotice } from "@/components/demo/DemoIndicators";
import { KycWizard } from "@/components/verify/KycWizard";
import { useAuth } from "@/hooks/use-auth";
import { useDemoBackend } from "@/hooks/use-demo-market";
import { useKycGate } from "@/hooks/use-kyc";

export default function Verify() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: backend, isLoading: backendLoading, refetch: retryBackend } = useDemoBackend();
  const { isApproved, isPending, isRejected, rejectionReason, isLoading: gateLoading } = useKycGate();

  if (loading || backendLoading) {
    return (
      <Centred>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Centred>
    );
  }

  if (!user) {
    return (
      <Centred>
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="font-display text-xl font-bold text-foreground">
          Sign in to verify your identity
        </h1>
        <Button onClick={() => navigate("/auth")}>Sign in</Button>
      </Centred>
    );
  }

  return (
    <div className="container py-12">
      <SEOHead
        title="Identity Verification - P2PxBT"
        description="Submit identity verification to unlock trading on P2PxBT."
        noindex
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Verify", href: "/verify" },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Identity Verification
          </h1>
          <p className="text-muted-foreground">
            Verification is reviewed by a P2PxBT operator before you can open a trade.
          </p>
        </header>

        {backend && backend.status !== "ready" ? (
          <DemoBackendNotice state={backend} onRetry={() => retryBackend()} />
        ) : gateLoading ? (
          <Centred>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Centred>
        ) : isApproved ? (
          <StatusCard
            tone="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Verification approved"
            body="Your identity has been approved by an operator. You can now open trades."
            action={<Button onClick={() => navigate("/marketplace")}>Go to marketplace</Button>}
          />
        ) : isPending ? (
          <StatusCard
            tone="pending"
            icon={<Clock className="h-5 w-5" />}
            title="Under review"
            body="Your documents are with a P2PxBT operator. This page updates as soon as a decision is made."
          />
        ) : (
          <>
            {isRejected && (
              <StatusCard
                tone="danger"
                className="mb-6"
                icon={<ShieldAlert className="h-5 w-5" />}
                title="Previous application rejected"
                body={rejectionReason ?? "Please submit clearer documents."}
              />
            )}
            <KycWizard />
          </>
        )}
      </div>
    </div>
  );
}

const TONES = {
  success: "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/[0.05] text-amber-600 dark:text-amber-400",
  danger: "border-destructive/30 bg-destructive/[0.05] text-destructive",
};

function StatusCard({
  tone,
  icon,
  title,
  body,
  action,
  className,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`${TONES[tone]} ${className ?? ""}`}>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
        {action}
      </CardContent>
    </Card>
  );
}

function Centred({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex flex-col items-center justify-center gap-3 py-24 text-center">
      {children}
    </div>
  );
}
