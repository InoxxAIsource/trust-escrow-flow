import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrustScoreBadgeProps {
  trustScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  low: {
    icon: ShieldCheck,
    label: "Trusted",
    badgeClass: "bg-success/10 text-success border-success/20",
    iconClass: "text-success",
  },
  medium: {
    icon: Shield,
    label: "Standard",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
    iconClass: "text-warning",
  },
  high: {
    icon: ShieldAlert,
    label: "Caution",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    iconClass: "text-destructive",
  },
  critical: {
    icon: ShieldX,
    label: "Restricted",
    badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
    iconClass: "text-destructive",
  },
};

const sizeConfig = {
  sm: { icon: "h-3 w-3", text: "text-[10px]", badge: "px-1.5 py-0" },
  md: { icon: "h-3.5 w-3.5", text: "text-xs", badge: "px-2 py-0.5" },
  lg: { icon: "h-4 w-4", text: "text-sm", badge: "px-2.5 py-1" },
};

export default function TrustScoreBadge({
  trustScore,
  riskLevel,
  size = "sm",
  showLabel = false,
  className,
}: TrustScoreBadgeProps) {
  const config = levelConfig[riskLevel];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 font-medium cursor-default",
            config.badgeClass,
            sizes.badge,
            sizes.text,
            className
          )}
        >
          <Icon className={cn(sizes.icon, config.iconClass)} />
          {showLabel ? config.label : `${trustScore}`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p className="font-medium">Trust Score: {trustScore}/100</p>
        <p className="text-muted-foreground">{config.label} trader</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Compact inline version for marketplace cards
export function TrustScoreInline({
  trustScore,
  riskLevel,
  className,
}: {
  trustScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  className?: string;
}) {
  const config = levelConfig[riskLevel];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px]", className)}>
      <Icon className={cn("h-3 w-3", config.iconClass)} />
      <span className={cn("font-medium", config.iconClass)}>{trustScore}</span>
    </span>
  );
}
