import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, ArrowRight } from "lucide-react";
import { useAuth, computeKycLevel, type Profile } from "@/hooks/use-auth";

function getProgress(profile: Profile): number {
  let p = 0;
  if (profile.is_email_verified) p += 25;
  if (profile.is_phone_verified) p += 25;
  if (profile.kyc_status === "verified") p += 25;
  if (profile.aml_status === "cleared") p += 25;
  return p;
}

const steps = [
  { key: "email", label: "Email Verified", check: (p: Profile) => p.is_email_verified },
  { key: "phone", label: "Phone Verified", check: (p: Profile) => p.is_phone_verified },
  { key: "kyc", label: "Identity Verified", check: (p: Profile) => p.kyc_status === "verified" },
  { key: "aml", label: "AML Cleared", check: (p: Profile) => p.aml_status === "cleared" },
] as const;

interface LevelConfig {
  heading: string;
  subtext: string;
  cta: string;
}

const levelConfig: Record<string, LevelConfig> = {
  guest: {
    heading: "Complete your account setup",
    subtext: "Verify your email and phone to start trading",
    cta: "Verify Now",
  },
  basic: {
    heading: "Unlock higher trading limits",
    subtext: "Increase limits up to ₹5,00,000",
    cta: "Verify Identity",
  },
  verified: {
    heading: "Enable high-value trading",
    subtext: "Required for trades above ₹1,00,000",
    cta: "Complete Advanced Verification",
  },
};

export default function VerificationProgressCard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  if (!profile) return null;

  const level = computeKycLevel(profile);
  if (level === "trusted") return null;

  const progress = getProgress(profile);
  const config = levelConfig[level];

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-base">{config.heading}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{config.subtext}</p>
          </div>
          <Badge variant="outline" className="text-xs font-mono shrink-0">{progress}%</Badge>
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="grid grid-cols-2 gap-2 mb-4">
          {steps.map((s) => {
            const done = s.check(profile);
            return (
              <div key={s.key} className="flex items-center gap-1.5 text-sm">
                {done ? (
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <Button onClick={() => navigate("/verify")} className="w-full" size="sm">
          <Shield className="h-4 w-4 mr-1" />
          {config.cta}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
