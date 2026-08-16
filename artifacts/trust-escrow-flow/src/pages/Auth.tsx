import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { demoDb } from "@/integrations/supabase/demo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, user } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Where an account belongs after authenticating. Operators go to the
   * console; everyone else goes to the marketplace, which is the start of the
   * trading flow. The role is read fresh rather than from the cached
   * useIsAdmin query, which may not have refetched yet at this point.
   */
  const destinationFor = useCallback(async (userId: string) => {
    const { data } = await demoDb
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return data ? "/admin" : "/marketplace";
  }, []);

  // Navigating during render is a side effect; an already-signed-in visitor
  // landing on /auth gets bounced here instead.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    destinationFor(user.id).then((to) => {
      if (!cancelled) navigate(to, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [user, destinationFor, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Welcome back");
        const { data } = await demoDb.auth.getUser();
        navigate(data.user ? await destinationFor(data.user.id) : "/marketplace", { replace: true });
      }
    } else {
      if (!username.trim()) {
        toast.error("Username is required");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      if (error) {
        toast.error(error);
      } else {
        // Email confirmation is disabled, so the account is
        // usable immediately -- send them straight to the marketplace.
        toast.success("Account created — browse the marketplace to start a trade.");
        navigate("/marketplace", { replace: true });
      }
    }
    setLoading(false);
  };

  return (
    <>
      <SEOHead title={`${isLogin ? "Login" : "Sign Up"} — P2PxBT`} description="Sign in to your P2PxBT account to trade crypto P2P with escrow protection." canonical="https://p2pxbt.com/auth" noindex />
      <div className="container max-w-md py-20">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl font-bold text-foreground">P2PxBT</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="e.g. crypto_trader"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
