import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, CreditCard, Loader2, CheckCircle, Mail, Phone, FileCheck, Lock, ArrowRight, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAuth, computeKycLevel, getTradeLimits } from "@/hooks/use-auth";
import { KycLevelBadge, VerificationStepBadges } from "@/components/VerificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerifySection = "overview" | "email" | "phone" | "kyc" | "aml";

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

const Verify = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [section, setSection] = useState<VerifySection>("overview");
  const [processing, setProcessing] = useState(false);

  // Email verification
  const [emailOtp, setEmailOtp] = useState("");

  // Phone verification
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // KYC (ID)
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("passport");
  const [kycStep, setKycStep] = useState<"form" | "processing" | "done">("form");

  // AML
  const [amlStep, setAmlStep] = useState<"start" | "processing" | "done">("start");

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <SEOHead title="Verify Identity — TrustP2P" description="Complete identity verification to trade on TrustP2P." canonical="https://buysusdtp2p.com/verify" />
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to verify your identity</h1>
        <Button onClick={() => navigate("/auth")} size="lg" className="mt-4">Sign In</Button>
      </div>
    );
  }

  const kycLevel = profile ? computeKycLevel(profile) : "guest";
  const limits = getTradeLimits(kycLevel);

  const updateProfile = async (fields: Record<string, unknown>) => {
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("user_id", user.id);
    if (error) throw error;
    await refreshProfile();
  };

  // Email mock verify
  const handleEmailVerify = async () => {
    if (emailOtp.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setProcessing(true);
    // Simulate verification delay
    await new Promise(r => setTimeout(r, 1500));
    try {
      await updateProfile({ is_email_verified: true, kyc_level: "basic" });
      toast.success("Email verified!");
      setSection("overview");
    } catch {
      toast.error("Verification failed");
    }
    setProcessing(false);
  };

  // Phone mock OTP send
  const handleSendPhoneOtp = () => {
    if (!phone.trim() || phone.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setPhoneOtpSent(true);
    toast.success("OTP sent to " + phone + " (demo: use 123456)");
  };

  // Phone mock verify
  const handlePhoneVerify = async () => {
    if (phoneOtp.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    try {
      await updateProfile({ is_phone_verified: true, phone, kyc_level: "basic" });
      toast.success("Phone verified!");
      setSection("overview");
    } catch {
      toast.error("Verification failed");
    }
    setProcessing(false);
  };

  // KYC mock flow
  const handleKycSubmit = async () => {
    if (!fullName.trim() || !dob) {
      toast.error("Fill in all fields");
      return;
    }
    setKycStep("processing");
    await new Promise(r => setTimeout(r, 2500));
    try {
      await updateProfile({ kyc_status: "verified", kyc_level: "verified", is_verified: true });
      setKycStep("done");
      toast.success("ID verified via third-party provider!");
    } catch {
      toast.error("Verification failed. Please try again.");
      setKycStep("form");
    }
  };

  // AML mock flow
  const handleAmlCheck = async () => {
    setAmlStep("processing");
    await new Promise(r => setTimeout(r, 2000));
    try {
      await updateProfile({ aml_status: "cleared", kyc_level: "trusted" });
      setAmlStep("done");
      toast.success("AML screening cleared!");
    } catch {
      toast.error("AML check failed");
      setAmlStep("start");
    }
  };

  return (
    <div className="container py-12">
      <SEOHead title="Verify Account — TrustP2P" description="Progressive verification to unlock full trading capabilities." />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }, { label: "Verify", href: "/verify" }]} />

      <div className="max-w-2xl mx-auto">
        {section === "overview" && (
          <>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Account Verification</h1>
              <p className="text-muted-foreground">Complete verification steps to unlock higher trading limits</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <KycLevelBadge level={kycLevel} />
                <span className="text-sm text-muted-foreground">Trade limit: <span className="font-medium text-foreground">{limits.label}</span></span>
              </div>
            </div>

            {profile && (
              <VerificationStepBadges
                isEmailVerified={profile.is_email_verified}
                isPhoneVerified={profile.is_phone_verified}
                kycStatus={profile.kyc_status}
                amlStatus={profile.aml_status}
                className="justify-center mb-8"
              />
            )}

            {profile?.is_demo_user && (
              <Card className="mb-6 border-warning/30 bg-warning/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Demo Mode — No real funds involved</p>
                    <p className="text-xs text-muted-foreground">Switch to real trading by completing verification below.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {/* Email Verification */}
              <Card className={profile?.is_email_verified ? "border-success/30" : "cursor-pointer hover:shadow-md transition-shadow"} onClick={() => !profile?.is_email_verified && setSection("email")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${profile?.is_email_verified ? "bg-success/10" : "bg-muted"}`}>
                    <Mail className={`h-5 w-5 ${profile?.is_email_verified ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Email Verification</p>
                    <p className="text-xs text-muted-foreground">Verify your email address to unlock basic trading</p>
                  </div>
                  {profile?.is_email_verified ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              {/* Phone Verification */}
              <Card className={profile?.is_phone_verified ? "border-success/30" : "cursor-pointer hover:shadow-md transition-shadow"} onClick={() => !profile?.is_phone_verified && setSection("phone")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${profile?.is_phone_verified ? "bg-success/10" : "bg-muted"}`}>
                    <Phone className={`h-5 w-5 ${profile?.is_phone_verified ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Phone Verification</p>
                    <p className="text-xs text-muted-foreground">Required before your first trade or ₹50K usage</p>
                  </div>
                  {profile?.is_phone_verified ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              {/* ID Verification */}
              <Card className={profile?.kyc_status === "verified" ? "border-success/30" : "cursor-pointer hover:shadow-md transition-shadow"} onClick={() => profile?.kyc_status !== "verified" && setSection("kyc")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${profile?.kyc_status === "verified" ? "bg-success/10" : "bg-muted"}`}>
                    <FileCheck className={`h-5 w-5 ${profile?.kyc_status === "verified" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">ID Verification</p>
                    <p className="text-xs text-muted-foreground">Verified via third-party provider — unlocks sell offers & ₹5L limit</p>
                  </div>
                  {profile?.kyc_status === "verified" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              {/* AML Screening */}
              <Card className={profile?.aml_status === "cleared" ? "border-success/30" : "cursor-pointer hover:shadow-md transition-shadow"} onClick={() => profile?.aml_status !== "cleared" && setSection("aml")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${profile?.aml_status === "cleared" ? "bg-success/10" : "bg-muted"}`}>
                    <Lock className={`h-5 w-5 ${profile?.aml_status === "cleared" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Advanced Verification (AML)</p>
                    <p className="text-xs text-muted-foreground">Required for trades &gt; ₹1L — unlocks unlimited trading</p>
                  </div>
                  {profile?.aml_status === "cleared" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trust level summary */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Verification Levels</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={kycLevel === "guest" ? "font-bold text-foreground" : "text-muted-foreground"}>🔓 Guest</span>
                    <span className="text-muted-foreground">Browse only</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={kycLevel === "basic" ? "font-bold text-foreground" : "text-muted-foreground"}>📧 Basic (Email + Phone)</span>
                    <span className="text-muted-foreground">Trade ≤ ₹50,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={kycLevel === "verified" ? "font-bold text-foreground" : "text-muted-foreground"}>🛡️ Verified (ID Check)</span>
                    <span className="text-muted-foreground">Trade ≤ ₹5,00,000 + Sell</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={kycLevel === "trusted" ? "font-bold text-foreground" : "text-muted-foreground"}>🔒 Trusted (AML Cleared)</span>
                    <span className="text-muted-foreground">Unlimited</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Email Verification Section */}
        {section === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Email Verification
              </CardTitle>
              <CardDescription>A 6-digit code has been sent to your email (demo: use any 6 digits).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-muted-foreground text-center">Demo mode — enter any 6 digits to verify</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSection("overview")}>Back</Button>
                <Button className="flex-1" onClick={handleEmailVerify} disabled={processing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Verify Email
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phone Verification Section */}
        {section === "phone" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" /> Phone Verification
              </CardTitle>
              <CardDescription>Verify your phone number to start trading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!phoneOtpSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setSection("overview")}>Back</Button>
                    <Button className="flex-1" onClick={handleSendPhoneOtp}>Send OTP</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">OTP sent to <span className="font-medium text-foreground">{phone}</span></p>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={phoneOtp} onChange={setPhoneOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Demo mode — use code: 123456</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }}>Change Number</Button>
                    <Button className="flex-1" onClick={handlePhoneVerify} disabled={processing}>
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Verify Phone
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* KYC / ID Verification Section */}
        {section === "kyc" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" /> ID Verification
              </CardTitle>
              <CardDescription>Verified via third-party provider. Complete to unlock sell offers and higher limits.</CardDescription>
            </CardHeader>
            <CardContent>
              {kycStep === "form" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Legal Name</Label>
                    <Input id="fullName" placeholder="e.g. John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="text" placeholder="DD/MM/YYYY" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Document Type</Label>
                    <RadioGroup value={idType} onValueChange={setIdType} className="space-y-2">
                      {ID_TYPES.map((t) => (
                        <div key={t.value} className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value={t.value} id={t.value} />
                          <Label htmlFor={t.value} className="cursor-pointer flex-1">{t.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <p className="text-xs text-muted-foreground">Demo — no actual documents required. Simulates ID upload + face match + liveness check.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setSection("overview")}>Back</Button>
                    <Button className="flex-1" onClick={handleKycSubmit}>Start Verification</Button>
                  </div>
                </div>
              )}
              {kycStep === "processing" && (
                <div className="py-16 text-center">
                  <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Verifying your identity...</h2>
                  <p className="text-muted-foreground text-sm">Checking ID, face match & liveness</p>
                </div>
              )}
              {kycStep === "done" && (
                <div className="py-16 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Identity Verified!</h2>
                  <p className="text-muted-foreground mb-6">You can now create sell offers and trade up to ₹5,00,000.</p>
                  <Button onClick={() => setSection("overview")}>Back to Overview</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AML Screening Section */}
        {section === "aml" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Advanced Verification (AML)
              </CardTitle>
              <CardDescription>Anti-money laundering screening — unlocks unlimited trading.</CardDescription>
            </CardHeader>
            <CardContent>
              {amlStep === "start" && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="text-foreground font-medium">This screening checks:</p>
                    <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Sanctions lists</li>
                      <li>Politically Exposed Persons (PEP)</li>
                      <li>Risk flags</li>
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground">Demo — screening is simulated and will auto-clear.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setSection("overview")}>Back</Button>
                    <Button className="flex-1" onClick={handleAmlCheck}>Run AML Check</Button>
                  </div>
                </div>
              )}
              {amlStep === "processing" && (
                <div className="py-16 text-center">
                  <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">Running AML screening...</h2>
                  <p className="text-muted-foreground text-sm">Checking sanctions, PEP, and risk flags</p>
                </div>
              )}
              {amlStep === "done" && (
                <div className="py-16 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="font-display text-xl font-bold text-foreground mb-2">AML Screening Cleared!</h2>
                  <p className="text-muted-foreground mb-6">You now have unlimited trading capabilities.</p>
                  <Button onClick={() => setSection("overview")}>Back to Overview</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Verify;
