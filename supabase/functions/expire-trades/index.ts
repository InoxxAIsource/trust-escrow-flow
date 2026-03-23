import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find locked trades past their expiry
    const { data: expiredTrades, error: fetchError } = await supabase
      .from("trades")
      .select("id")
      .eq("status", "locked")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredTrades || expiredTrades.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired trades found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = expiredTrades.map((t) => t.id);

    const { error: updateError } = await supabase
      .from("trades")
      .update({ status: "expired" })
      .in("id", ids);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: "Expired trades updated", count: ids.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
