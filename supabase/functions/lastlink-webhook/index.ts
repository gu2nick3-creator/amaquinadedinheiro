import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Webhook received:", body);

    const { email, event, status, plan_name, customer_id, subscription_id } = body;

    if (event === "payment.approved" || status === "active") {
      // Find or create profile by email
      let { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        // Update profile
        await supabaseClient
          .from("profiles")
          .update({
            status: "active",
            plano: plan_name || "pro",
            access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", profile.id);

        // Record subscription
        await supabaseClient.from("subscriptions").insert({
          user_id: profile.id,
          customer_email: email,
          provider: "lastlink",
          provider_customer_id: customer_id,
          provider_subscription_id: subscription_id,
          plan_name: plan_name,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Update usage limits for Pro
        await supabaseClient
          .from("usage_limits")
          .update({ generation_limit: 1000 })
          .eq("user_id", profile.id);
      }
    } else if (event === "subscription.canceled" || status === "canceled") {
      // Handle cancelation
      let { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        await supabaseClient
          .from("profiles")
          .update({ status: "expired" })
          .eq("id", profile.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
