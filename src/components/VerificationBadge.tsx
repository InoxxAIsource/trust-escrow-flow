import { Shield, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type KycStatus = "unverified" | "pending" | "verified";

interface VerificationBadgeProps {
  status: KycStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const config: Record<KycStatus, { icon: React.ElementType; label: string; classes: string }> = {
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
};

export const VerificationBadge = ({ status, size = "sm", showLabel = true, className }: VerificationBadgeProps) => {
  const { icon: Icon, label, classes } = config[status];
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
