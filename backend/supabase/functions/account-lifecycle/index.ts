// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonRes({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonRes({ error: "Invalid session" }, 401);
    }

    const body = await req.json();
    if (body.confirmText !== "DELETE") {
      return jsonRes({ error: 'Confirmation text "DELETE" is required' }, 400);
    }

    const uid = userData.user.id;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await adminClient
      .from("User")
      .select("role, email")
      .eq("id", uid)
      .maybeSingle();

    if (profile?.role === "ADMIN") {
      return jsonRes({ error: "Admin accounts cannot be self-deleted here" }, 403);
    }

    // Clean personal engagement & devices; anonymize user profile
    await adminClient.from("UserDevice").delete().eq("userId", uid);
    await adminClient.from("Save").delete().eq("userId", uid);
    await adminClient.from("Follow").delete().or(`followerId.eq.${uid},followingId.eq.${uid}`);
    await adminClient.from("Notification").delete().eq("userId", uid);
    await adminClient.from("Vote").delete().eq("userId", uid);
    await adminClient.from("CommentVote").delete().eq("userId", uid);

    await adminClient
      .from("User")
      .update({
        account_status: "deactivated",
        deleted_at: new Date().toISOString(),
        email: `deleted_${uid}@deleted.postsapp.local`,
        username: `deleted_${uid.slice(0, 8)}`,
        phone: null,
        bio: null,
        avatarUrl: null,
        coverUrl: null,
        push_token: null,
        selected_topics: null,
      })
      .eq("id", uid);

    await adminClient.from("audit_logs").insert({
      actor_id: uid,
      actor_role: profile?.role || "CITIZEN",
      action: "user.self_delete",
      resource_type: "User",
      resource_id: uid,
      outcome: "success",
    });

    await adminClient.auth.admin.deleteUser(uid);

    return jsonRes({ success: true, message: "Account deleted" });
  } catch (err: any) {
    console.error("[account-lifecycle] Error:", err);
    return jsonRes({ error: err?.message || "Failed to delete account" }, 500);
  }
});
