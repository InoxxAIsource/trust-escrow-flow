import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type KycLevel = "guest" | "basic" | "verified" | "trusted";
export type KycStatus = "not_started" | "pending" | "verified" | "rejected" | "unverified";
export type AmlStatus = "not_checked" | "cleared" | "flagged";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  trades_count: number;
  completion_rate: number;
  is_verified: boolean;
  kyc_status: KycStatus;
  kyc_level: KycLevel;
  kyc_provider: string;
  aml_status: AmlStatus;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  phone: string | null;
  is_demo_user: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as unknown as Profile);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Utility to compute the effective KYC level from profile fields
export function computeKycLevel(profile: Profile): KycLevel {
  if (profile.aml_status === "cleared") return "trusted";
  if (profile.kyc_status === "verified") return "verified";
  if (profile.is_email_verified && profile.is_phone_verified) return "basic";
  if (profile.is_email_verified) return "basic";
  return "guest";
}

// Trade limit based on KYC level (in INR)
export function getTradeLimits(level: KycLevel): { max: number; label: string } {
  switch (level) {
    case "guest": return { max: 0, label: "Verify to trade" };
    case "basic": return { max: 50000, label: "₹50,000" };
    case "verified": return { max: 500000, label: "₹5,00,000" };
    case "trusted": return { max: Infinity, label: "Unlimited" };
  }
}
