import { useState } from "react";
import { Shield, ShieldAlert, ShieldX, AlertTriangle, CheckCircle, Clock, Eye, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { type RiskProfile, type RiskEvent, getTrustScore } from "@/hooks/use-risk";

function useAllRiskProfiles() {
  return useQuery({
    queryKey: ["admin-risk-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_profiles")
        .select("*")
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RiskProfile[];
    },
  });
}

function useAllRiskEvents() {
  return useQuery({
    queryKey: ["admin-risk-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as RiskEvent[];
    },
  });
}

const levelColors: Record<string, string> = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const severityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-warning",
  high: "text-destructive",
};

export default function AdminRisk() {
  const { user } = useAuth();
  const { data: profiles, isLoading: profilesLoading } = useAllRiskProfiles();
  const { data: events, isLoading: eventsLoading } = useAllRiskEvents();

  const highRiskUsers = profiles?.filter((p) => p.risk_level === "high" || p.risk_level === "critical") ?? [];
  const criticalCount = profiles?.filter((p) => p.risk_level === "critical").length ?? 0;
  const highCount = profiles?.filter((p) => p.risk_level === "high").length ?? 0;

  return (
    <div className="min-h-screen">
      <SEOHead title="Risk Dashboard — Admin" description="Monitor and manage user risk levels" />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin Risk Dashboard" }]} />

        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Risk Dashboard</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">{highCount}</p>
                <p className="text-xs text-muted-foreground">High Risk Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{events?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Recent Events</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">High Risk Users</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="all">All Users</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {highRiskUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>No high-risk users detected</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highRiskUsers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.user_id.slice(0, 8)}…</TableCell>
                        <TableCell className="font-bold">{p.risk_score}</TableCell>
                        <TableCell>
                          <TrustScoreBadge
                            trustScore={getTrustScore(p.risk_score)}
                            riskLevel={p.risk_level as any}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={levelColors[p.risk_level] ?? ""}>
                            {p.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.last_updated).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {(events?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No risk events recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events?.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{e.user_id.slice(0, 8)}…</TableCell>
                        <TableCell className="text-sm">{e.event_type.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <span className={severityColors[e.severity] ?? ""}>{e.severity}</span>
                        </TableCell>
                        <TableCell className="font-bold">
                          {e.score_impact > 0 ? `+${e.score_impact}` : e.score_impact}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {profilesLoading ? (
              <p className="text-muted-foreground p-4">Loading…</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.user_id.slice(0, 8)}…</TableCell>
                        <TableCell className="font-bold">{p.risk_score}</TableCell>
                        <TableCell>
                          <TrustScoreBadge
                            trustScore={getTrustScore(p.risk_score)}
                            riskLevel={p.risk_level as any}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={levelColors[p.risk_level] ?? ""}>
                            {p.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.last_updated).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
