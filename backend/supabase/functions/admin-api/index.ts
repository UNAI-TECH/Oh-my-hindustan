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

    if (!supabaseUrl || !serviceKey) {
      return jsonRes({ error: "Server configuration missing" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonRes({ error: "Missing authorization token" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: authUserData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUserData?.user) {
      return jsonRes({ error: "Invalid or expired session" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const callerId = authUserData.user.id;
    const { data: callerProfile, error: callerErr } = await adminClient
      .from("User")
      .select("id, role, account_status, email")
      .eq("id", callerId)
      .maybeSingle();

    if (callerErr || !callerProfile || callerProfile.role !== "ADMIN" || callerProfile.account_status !== "active") {
      return jsonRes({ error: "Forbidden: active ADMIN role required" }, 403);
    }

    const body = await req.json();
    const { action, payload = {} } = body;

    const audit = async (
      act: string,
      resourceType: string,
      resourceId: string | null,
      prev: unknown = null,
      next: unknown = null,
      outcome = "success",
      meta: unknown = {}
    ) => {
      await adminClient.from("audit_logs").insert({
        actor_id: callerId,
        actor_role: "ADMIN",
        action: act,
        resource_type: resourceType,
        resource_id: resourceId,
        previous_values: prev,
        updated_values: next,
        outcome,
        metadata: meta,
      });
    };

    switch (action) {
      case "getOverviewStats": {
        const [
          readersRes,
          creatorsRes,
          activeCreatorsRes,
          pendingReqRes,
          postsRes,
          commentsRes,
          adsRes,
        ] = await Promise.all([
          adminClient.from("User").select("id", { count: "exact", head: true }).eq("role", "CITIZEN"),
          adminClient.from("User").select("id", { count: "exact", head: true }).in("role", ["ANALYST", "CREATOR"]),
          adminClient.from("User").select("id", { count: "exact", head: true }).in("role", ["ANALYST", "CREATOR"]).eq("account_status", "active"),
          adminClient.from("creator_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          adminClient.from("Post").select("id, status, language, views_count, likes_count, comments_count, is_active"),
          adminClient.from("Comment").select("id", { count: "exact", head: true }).neq("content", "[SYSTEM_REPOST]"),
          adminClient.from("ads").select("impressions_count, clicks_count, total_spent, status"),
        ]);

        const posts = postsRes.data || [];
        const ads = adsRes.data || [];

        return jsonRes({
          totalReaders: readersRes.count || 0,
          totalCreators: creatorsRes.count || 0,
          activeCreators: activeCreatorsRes.count || 0,
          pendingRequests: pendingReqRes.count || 0,
          totalPosts: posts.length,
          publishedPosts: posts.filter((p) => p.status === "PUBLISHED" && p.is_active !== false).length,
          draftPosts: posts.filter((p) => p.status === "DRAFT").length,
          scheduledPosts: posts.filter((p) => p.status === "SCHEDULED").length,
          archivedPosts: posts.filter((p) => p.status === "ARCHIVED").length,
          englishPosts: posts.filter((p) => p.language === "en").length,
          tamilPosts: posts.filter((p) => p.language === "ta").length,
          totalViews: posts.reduce((s, p) => s + (p.views_count || 0), 0),
          totalLikes: posts.reduce((s, p) => s + (p.likes_count || 0), 0),
          totalComments: commentsRes.count || 0,
          adImpressions: ads.reduce((s, a) => s + (a.impressions_count || 0), 0),
          adClicks: ads.reduce((s, a) => s + (a.clicks_count || 0), 0),
          adSpend: ads.reduce((s, a) => s + Number(a.total_spent || 0), 0),
          activeAds: ads.filter((a) => a.status === "active").length,
        });
      }

      case "getCreatorRequests": {
        let q = adminClient.from("creator_requests").select("*").order("created_at", { ascending: false });
        if (payload.filter && payload.filter !== "ALL") {
          q = q.eq("status", String(payload.filter).toLowerCase());
        }
        const { data, error } = await q;
        if (error) throw error;
        return jsonRes({ data: data || [] });
      }

      case "createCreatorAccount": {
        const email = String(payload.email || "").trim().toLowerCase();
        const fullName = String(payload.fullName || "").trim();
        const bio = String(payload.bio || "").trim();
        const password = payload.password ? String(payload.password) : undefined;
        const creatorPortalUrl = payload.redirectTo || Deno.env.get("CREATOR_PORTAL_URL") || undefined;

        if (!email) return jsonRes({ error: "Email is required" }, 400);

        const rawBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "creator";
        const { data: existingRow } = await adminClient
          .from("User")
          .select("id, role, username, channel_name, bio")
          .ilike("email", email)
          .maybeSingle();

        let authUserId = existingRow?.id;
        let actionLink: string | null = null;

        if (!authUserId) {
          const { data: listRes } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const matched = (listRes?.users || []).find((u) => (u.email || "").toLowerCase() === email);
          authUserId = matched?.id;
        }

        if (authUserId) {
          if (password && password.length >= 8) {
            const { error: updErr } = await adminClient.auth.admin.updateUserById(authUserId, {
              password,
              email_confirm: true,
              user_metadata: { full_name: fullName || existingRow?.channel_name },
            });
            if (updErr) throw updErr;
          } else {
            const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
              type: "recovery",
              email,
              options: creatorPortalUrl ? { redirectTo: creatorPortalUrl } : undefined,
            });
            if (!linkErr) actionLink = linkData?.properties?.action_link || null;
          }
        } else {
          if (password && password.length >= 8) {
            const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: fullName, username: `${rawBase}_${Date.now()}` },
            });
            if (createErr || !created.user) throw createErr || new Error("Failed to create auth user");
            authUserId = created.user.id;
          } else {
            const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.generateLink({
              type: "invite",
              email,
              options: {
                data: { full_name: fullName, username: `${rawBase}_${Date.now()}` },
                ...(creatorPortalUrl ? { redirectTo: creatorPortalUrl } : {}),
              },
            });
            if (inviteErr || !inviteData?.user) throw inviteErr || new Error("Failed to generate invite");
            authUserId = inviteData.user.id;
            actionLink = inviteData.properties?.action_link || null;
          }
        }

        let uniqueUsername = existingRow?.username;
        if (!uniqueUsername || /_\d{10,}$/.test(uniqueUsername)) {
          const { data: conflict } = await adminClient
            .from("User")
            .select("id")
            .eq("username", rawBase)
            .neq("id", authUserId)
            .maybeSingle();
          uniqueUsername = conflict ? `${rawBase}_${Date.now().toString().slice(-5)}` : rawBase;
        }

        const now = new Date().toISOString();
        const targetRole = existingRow?.role === "ADMIN" ? "ADMIN" : "CREATOR";

        const { error: upsertErr } = await adminClient.from("User").upsert({
          id: authUserId,
          email,
          username: uniqueUsername,
          password: "",
          channel_name: existingRow?.channel_name || fullName || uniqueUsername,
          bio: bio || existingRow?.bio || "",
          role: targetRole,
          account_status: "active",
          updatedAt: now,
        });
        if (upsertErr) throw upsertErr;

        await audit("creator.provision", "User", authUserId, null, { email, role: targetRole, invited: !password });
        return jsonRes({ userId: authUserId, email, username: uniqueUsername, actionLink });
      }

      case "approveCreatorRequest": {
        const { requestId, adminMessage } = payload;
        const { data: prev } = await adminClient.from("creator_requests").select("*").eq("id", requestId).single();
        const { error } = await adminClient
          .from("creator_requests")
          .update({
            status: "approved",
            admin_message: adminMessage || "Your application has been approved! Use your invitation/setup link to access Creator Studio.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);
        if (error) throw error;
        await audit("creator_request.approve", "creator_requests", requestId, { status: prev?.status }, { status: "approved", adminMessage });
        return jsonRes({ success: true });
      }

      case "rejectCreatorRequest": {
        const { requestId, adminMessage } = payload;
        const { data: prev } = await adminClient.from("creator_requests").select("*").eq("id", requestId).single();
        const { error } = await adminClient
          .from("creator_requests")
          .update({
            status: "rejected",
            admin_message: adminMessage || "Your application has been rejected.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);
        if (error) throw error;
        await audit("creator_request.reject", "creator_requests", requestId, { status: prev?.status }, { status: "rejected", adminMessage });
        return jsonRes({ success: true });
      }

      case "sendPasswordReset": {
        const email = String(payload.email || "").trim().toLowerCase();
        if (!email) return jsonRes({ error: "Email required" }, 400);
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
          options: payload.redirectTo ? { redirectTo: payload.redirectTo } : undefined,
        });
        if (error) throw error;
        await audit("user.password_reset_link", "User", data.user?.id || null, null, { email });
        return jsonRes({ actionLink: data?.properties?.action_link || null });
      }

      case "getUsers": {
        const roleFilter = payload.roleFilter || "ALL";
        let q = adminClient
          .from("User")
          .select("id, email, username, role, bio, avatarUrl, coverUrl, channel_name, phone, preferred_language, account_status, suspended_at, suspended_reason, onboarding_complete, createdAt, updatedAt")
          .is("deleted_at", null)
          .order("createdAt", { ascending: false });

        if (roleFilter === "CREATORS") q = q.in("role", ["ANALYST", "CREATOR"]);
        else if (roleFilter === "READERS") q = q.eq("role", "CITIZEN");

        const { data, error } = await q;
        if (error) throw error;
        return jsonRes({ data: data || [] });
      }

      case "updateUserStatus": {
        const { userId, account_status, reason } = payload;
        if (!userId || !["active", "suspended", "deactivated"].includes(account_status)) {
          return jsonRes({ error: "Invalid userId or account_status" }, 400);
        }
        if (userId === callerId) {
          return jsonRes({ error: "Cannot change your own admin status" }, 400);
        }
        const { data: prev } = await adminClient.from("User").select("account_status, suspended_reason").eq("id", userId).single();
        const updates: Record<string, unknown> = {
          account_status,
          suspended_at: account_status === "suspended" ? new Date().toISOString() : null,
          suspended_reason: account_status === "suspended" ? (reason || "Suspended by administrator") : null,
          updatedAt: new Date().toISOString(),
        };
        const { error } = await adminClient.from("User").update(updates).eq("id", userId);
        if (error) throw error;

        if (account_status !== "active") {
          await adminClient.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        } else {
          await adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
        }

        await audit(`user.${account_status}`, "User", userId, prev, updates);
        return jsonRes({ success: true });
      }

      case "deleteUserAccount": {
        const { userId } = payload;
        if (!userId || userId === callerId) return jsonRes({ error: "Invalid target user" }, 400);
        const { data: prev } = await adminClient.from("User").select("email, role, username").eq("id", userId).single();

        await adminClient.from("UserDevice").delete().eq("userId", userId);
        await adminClient.from("Save").delete().eq("userId", userId);
        await adminClient.from("Follow").delete().or(`followerId.eq.${userId},followingId.eq.${userId}`);
        await adminClient.from("Notification").delete().eq("userId", userId);

        const { error } = await adminClient
          .from("User")
          .update({
            account_status: "deactivated",
            deleted_at: new Date().toISOString(),
            email: `deleted_${userId}@deleted.postsapp.local`,
            username: `deleted_${userId.slice(0, 8)}`,
            phone: null,
            bio: null,
            avatarUrl: null,
            coverUrl: null,
            push_token: null,
          })
          .eq("id", userId);
        if (error) throw error;

        await adminClient.auth.admin.deleteUser(userId);
        await audit("user.delete", "User", userId, prev, { deleted: true });
        return jsonRes({ success: true });
      }

      case "getAllPosts": {
        const limit = Math.min(Number(payload.limit) || 200, 500);
        const { data, error } = await adminClient
          .from("Post")
          .select("*, User:User!authorId(id, username, email, avatarUrl, channel_name)")
          .order("createdAt", { ascending: false })
          .limit(limit);
        if (error) throw error;
        return jsonRes({ data: data || [] });
      }

      case "adminUpdatePost": {
        const { postId, updates } = payload;
        const { data: prev } = await adminClient.from("Post").select("*").eq("id", postId).single();
        if (!prev) return jsonRes({ error: "Post not found" }, 404);

        const allowedFields = [
          "title", "subtitle", "short_description", "content", "content_json", "language", "slug",
          "category", "custom_category", "thumbnail", "status", "is_active", "isTrending",
          "is_breaking", "is_featured", "is_editors_pick", "seo_title", "seo_description",
          "canonical_url", "og_title", "og_description", "og_image", "robots_index",
          "featured_image_alt", "featured_image_caption", "featured_image_credit", "translation_group_id"
        ];
        const safeUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        for (const k of allowedFields) {
          if (updates && k in updates) safeUpdates[k] = updates[k];
        }
        if (safeUpdates.status === "PUBLISHED" && !prev.published_at) {
          safeUpdates.published_at = new Date().toISOString();
        }

        const { data: updated, error } = await adminClient
          .from("Post")
          .update(safeUpdates)
          .eq("id", postId)
          .select()
          .single();
        if (error) throw error;

        await audit("post.admin_update", "Post", postId, { status: prev.status, is_active: prev.is_active }, safeUpdates);
        return jsonRes({ data: updated });
      }

      case "adminDeletePost": {
        const { postId } = payload;
        const { data: prev } = await adminClient.from("Post").select("id, title, authorId, status").eq("id", postId).single();
        await adminClient.from("Comment").delete().eq("postId", postId);
        await adminClient.from("Vote").delete().eq("postId", postId);
        await adminClient.from("Save").delete().eq("postId", postId);
        await adminClient.from("PostView").delete().eq("postId", postId);
        const { error } = await adminClient.from("Post").delete().eq("id", postId);
        if (error) throw error;
        await audit("post.admin_delete", "Post", postId, prev, null);
        return jsonRes({ success: true });
      }

      case "respondFeedback": {
        const { feedbackId, status, response_text } = payload;
        const { data: prev } = await adminClient.from("Feedback").select("*").eq("id", feedbackId).single();
        const { data, error } = await adminClient
          .from("Feedback")
          .update({
            status: status || "resolved",
            response_text,
            responded_by: callerId,
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", feedbackId)
          .select()
          .single();
        if (error) throw error;
        await audit("feedback.respond", "Feedback", feedbackId, prev, { status, response_text });
        return jsonRes({ data });
      }

      case "toggleVideoAds": {
        const { postId, enabled, durationSeconds } = payload;
        const adBreaksJson: Array<{ type: string; time: number }> = [];
        if (enabled) {
          adBreaksJson.push({ type: "pre", time: 0 });
          if (durationSeconds >= 30) adBreaksJson.push({ type: "mid", time: 30 });
          if (durationSeconds > 60) adBreaksJson.push({ type: "mid", time: Math.floor(durationSeconds * (2 / 3)) });
        }
        const { error: updErr } = await adminClient
          .from("Post")
          .update({ ads_enabled: !!enabled, ad_breaks: adBreaksJson })
          .eq("id", postId);
        if (updErr) throw updErr;

        await adminClient.from("video_ad_slots").delete().eq("post_id", postId);
        if (enabled && durationSeconds > 30) {
          const slots: Array<{ post_id: string; ad_position_seconds: number }> = [];
          if (durationSeconds > 60) slots.push({ post_id: postId, ad_position_seconds: 30 });
          if (durationSeconds > 120) slots.push({ post_id: postId, ad_position_seconds: 60 });
          if (durationSeconds > 180) slots.push({ post_id: postId, ad_position_seconds: 120 });
          if (slots.length > 0) await adminClient.from("video_ad_slots").insert(slots);
        }
        await audit("video_ads.toggle", "Post", postId, null, { enabled, durationSeconds, adBreaksJson });
        return jsonRes({ success: true });
      }

      case "getAuditLogs": {
        const limit = Math.min(Number(payload.limit) || 100, 300);
        const offset = Math.max(Number(payload.offset) || 0, 0);
        let q = adminClient.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
        if (payload.actionFilter) q = q.ilike("action", `%${payload.actionFilter}%`);
        if (payload.resourceFilter) q = q.eq("resource_type", payload.resourceFilter);
        if (payload.actorFilter) q = q.eq("actor_id", payload.actorFilter);
        const { data, count, error } = await q.range(offset, offset + limit - 1);
        if (error) throw error;
        return jsonRes({ data: data || [], total: count || 0 });
      }

      case "writeAudit": {
        await audit(
          payload.auditAction || "admin.action",
          payload.resourceType || "System",
          payload.resourceId || null,
          payload.previousValues || null,
          payload.updatedValues || null
        );
        return jsonRes({ success: true });
      }

      default:
        return jsonRes({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("[admin-api] Error:", err);
    return jsonRes({ error: err?.message || "Internal server error" }, 500);
  }
});
