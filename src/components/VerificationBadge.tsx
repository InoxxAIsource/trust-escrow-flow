import { Shield, ShieldCheck, ShieldAlert, Clock, Mail, Phone, FileCheck, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KycLevel, KycStatus, AmlStatus } from "@/hooks/use-auth";

// Legacy KYC status badge (backward compat)
type LegacyKycStatus = "unverified" | "pending" | "verified";

interface VerificationBadgeProps {
  status: LegacyKycStatus | KycStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const config: Record<string, { icon: React.ElementType; label: string; classes: string }> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    classes: "bg-success/10 text-success border-success/20",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    classes: "bg-warning/10 text-warning border-warning/20",
  },
  unverified: {
    icon: ShieldAlert,
    label: "Unverified",
    classes: "bg-muted text-muted-foreground border-border",
  },
  not_started: {
    icon: ShieldAlert,
    label: "Not Started",
    classes: "bg-muted text-muted-foreground border-border",
  },
  rejected: {
    icon: ShieldAlert,
    label: "Rejected",
    classes: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const VerificationBadge = ({ status, size = "sm", showLabel = true, className }: VerificationBadgeProps) => {
  const cfg = config[status] ?? config.unverified;
  const { icon: Icon, label, classes } = cfg;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Badge className={cn(classes, "border", className)}>
      <Icon className={cn(iconSize, showLabel && "mr-1")} />
      {showLabel && <span className={size === "sm" ? "text-xs" : "text-sm"}>{label}</span>}
    </Badge>
  );
};

export const VerificationIcon = ({ isVerified, className }: { isVerified: boolean; className?: string }) => (
  isVerified ? <ShieldCheck className={cn("h-4 w-4 text-success", className)} /> : null
);

// Multi-level KYC badge
interface KycLevelBadgeProps {
  level: KycLevel;
  className?: string;
}

const levelConfig: Record<KycLevel, { label: string; icon: React.ElementType; classes: string }> = {
  guest: { label: "Guest", icon: Shield, classes: "bg-muted text-muted-foreground border-border" },
  basic: { label: "Basic", icon: Mail, classes: "bg-primary/10 text-primary border-primary/20" },
  verified: { label: "Verified", icon: FileCheck, classes: "bg-success/10 text-success border-success/20" },
  trusted: { label: "Trusted", icon: ShieldCheck, classes: "bg-success/10 text-success border-success/20" },
};

export const KycLevelBadge = ({ level, className }: KycLevelBadgeProps) => {
  const { label, icon: Icon, classes } = levelConfig[level];
  return (
    <Badge className={cn(classes, "border", className)}>
      <Icon className="h-3 w-3 mr-1" />
      <span className="text-xs">{label}</span>
    </Badge>
  );
};

// Individual verification step badges
interface VerificationStepBadgesProps {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  className?: string;
}

export const VerificationStepBadges = ({ isEmailVerified, isPhoneVerified, kycStatus, amlStatus, className }: VerificationStepBadgesProps) => (
  <div className={cn("flex flex-wrap gap-1.5", className)}>
    <Badge className={cn("border text-xs", isEmailVerified ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border")}>
      <Mail className="h-3 w-3 mr-1" /> Email {isEmailVerified ? "✓" : "✗"}
    </Badge>
    <Badge className={cn("border text-xs", isPhoneVerified ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border")}>
      <Phone className="h-3 w-3 mr-1" /> Phone {isPhoneVerified ? "✓" : "✗"}
    </Badge>
    {(kycStatus === "verified" || kycStatus === "pending") && (
      <Badge className={cn("border text-xs", kycStatus === "verified" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20")}>
        <FileCheck className="h-3 w-3 mr-1" /> ID {kycStatus === "verified" ? "✓" : "⏳"}
      </Badge>
    )}
    {amlStatus === "cleared" && (
      <Badge className="border text-xs bg-success/10 text-success border-success/20">
        <Lock className="h-3 w-3 mr-1" /> AML ✓
      </Badge>
    )}
    {amlStatus === "flagged" && (
      <Badge className="border text-xs bg-destructive/10 text-destructive border-destructive/20">
        <Lock className="h-3 w-3 mr-1" /> AML ⚠
      </Badge>
    )}
  </div>
);
