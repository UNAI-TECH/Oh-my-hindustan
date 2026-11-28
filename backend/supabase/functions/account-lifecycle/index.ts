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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    const uid = userData.user.id;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.action === "completeCreatorOtpSetup") {
      const otp = String(body.otp || "").trim();
      const newPassword = String(body.newPassword || "");

      if (!otp) {
        return jsonRes({ error: "One-time password is required" }, 400);
      }
      if (newPassword.length < 8) {
        return jsonRes({ error: "New password must be at least 8 characters" }, 400);
      }

      const { data: authRecord, error: authFetchErr } = await adminClient.auth.admin.getUserById(uid);
      if (authFetchErr || !authRecord?.user) {
        return jsonRes({ error: "Account not found" }, 404);
      }

      const appMeta = authRecord.user.app_metadata || {};
      if (!appMeta.must_change_password || !appMeta.otp_hash) {
        return jsonRes({ error: "No pending one-time password verification found for this account" }, 400);
      }

      if (appMeta.otp_expires_at && new Date(appMeta.otp_expires_at).getTime() < Date.now()) {
        return jsonRes({ error: "One-time password has expired. Ask an administrator to issue a new one." }, 400);
      }

      const providedHash = await sha256Hex(otp);
      if (providedHash !== appMeta.otp_hash) {
        return jsonRes({ error: "The one-time password does not match our records." }, 403);
      }

      const nowIso = new Date().toISOString();
      const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(uid, {
        password: newPassword,
        app_metadata: {
          ...appMeta,
          must_change_password: false,
          otp_hash: null,
          otp_used_at: nowIso,
        },
      });
      if (updateAuthErr) throw updateAuthErr;

      try {
        await adminClient
          .from("creator_otp_credentials")
          .update({
            consumed_at: nowIso,
            must_change_password: false,
            updated_at: nowIso,
          })
          .eq("user_id", uid);
      } catch (_) {}

      const { data: profile } = await adminClient
        .from("User")
        .select("role")
        .eq("id", uid)
        .maybeSingle();

      await adminClient.from("audit_logs").insert({
        actor_id: uid,
        actor_role: profile?.role || "CREATOR",
        action: "creator.otp_password_set",
        resource_type: "User",
        resource_id: uid,
        outcome: "success",
      });

      return jsonRes({ success: true });
    }

    if (body.confirmText !== "DELETE") {
      return jsonRes({ error: 'Confirmation text "DELETE" is required' }, 400);
    }

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
