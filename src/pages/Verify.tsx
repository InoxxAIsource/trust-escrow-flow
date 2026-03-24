import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

const Verify = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("passport");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <SEOHead title="Verify Identity — TrustP2P" description="Complete identity verification to trade on TrustP2P." />
        <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to verify your identity</h1>
        <Button onClick={() => navigate("/auth")} size="lg" className="mt-4">Sign In</Button>
      </div>
    );
  }

  if (profile?.is_verified) {
    return (
      <div className="container py-20 text-center">
        <SEOHead title="Verified — TrustP2P" description="Your identity is verified." />
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Already Verified</h1>
        <p className="text-muted-foreground mb-6">Your identity has been verified. You can trade with full trust.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  const handleSubmitStep1 = () => {
    if (!fullName.trim() || !dob) {
      toast.error("Please fill in all fields");
      return;
    }
    setStep(2);
  };

  const handleSubmitStep2 = () => {
    setStep(3);
    setProcessing(true);
    // Simulate processing
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ kyc_status: "verified", is_verified: true })
          .eq("user_id", user.id);
        if (error) throw error;
        setProcessing(false);
        setDone(true);
        toast.success("Identity verified successfully!");
      } catch {
        setProcessing(false);
        toast.error("Verification failed. Please try again.");
        setStep(1);
      }
    }, 2500);
  };

  return (
    <div className="container py-12">
      <SEOHead title="Verify Identity — TrustP2P" description="Complete identity verification to unlock full trading." />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }, { label: "Verify", href: "/verify" }]} />

      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s || done ? "bg-success text-success-foreground" : step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s || done ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-success" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Enter your legal name and date of birth as shown on your ID.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name</Label>
                <Input id="fullName" placeholder="e.g. John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSubmitStep1}>Continue</Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: ID Type */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Select ID Type
              </CardTitle>
              <CardDescription>Choose the type of government-issued ID you'd like to use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={idType} onValueChange={setIdType} className="space-y-3">
                {ID_TYPES.map((t) => (
                  <div key={t.value} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={t.value} id={t.value} />
                    <Label htmlFor={t.value} className="cursor-pointer flex-1">{t.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">This is a demo verification — no actual documents are required.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={handleSubmitStep2}>Verify Identity</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing / Done */}
        {step === 3 && (
          <Card>
            <CardContent className="py-16 text-center">
              {processing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Verifying your identity...</h2>
                  <p className="text-muted-foreground">This usually takes a few seconds.</p>
                </>
              ) : done ? (
                <>
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Identity Verified!</h2>
                  <p className="text-muted-foreground mb-6">Your account is now verified. You can trade with full trust.</p>
                  <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Verify;
