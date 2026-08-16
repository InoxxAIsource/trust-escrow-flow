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
      .select("id, seller_id, asset, amount")
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

    // Mark trades as expired
    const { error: updateError } = await supabase
      .from("trades")
      .update({ status: "expired" })
      .in("id", ids);

    if (updateError) throw updateError;

    // Restore seller locked_balance for each expired trade
    for (const trade of expiredTrades) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance, locked_balance")
        .eq("user_id", trade.seller_id)
        .eq("asset", trade.asset)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            balance: Number(wallet.balance) + Number(trade.amount),
            locked_balance: Math.max(0, Number(wallet.locked_balance) - Number(trade.amount)),
          })
          .eq("id", wallet.id);
      }
    }

    return new Response(
      JSON.stringify({ message: "Expired trades updated, funds restored", count: ids.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
