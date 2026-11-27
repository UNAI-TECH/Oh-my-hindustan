// @ts-nocheck
/**
 * SUPABASE EDGE FUNCTION: notify-followers
 * Idempotent follower notification & FCM v1 dispatcher (fires only on PUBLISHED posts).
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as jose from "https://esm.sh/jose@4.14.4";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const record = body.record || body.payload || body;

    if (!record || !record.id || !record.authorId) {
      return new Response(JSON.stringify({ error: "Missing record, id, or authorId" }), { status: 400 });
    }

    // Never notify for DRAFT, SCHEDULED, ARCHIVED, or inactive posts
    if (record.status !== "PUBLISHED" || record.is_active === false) {
      return new Response(JSON.stringify({ skipped: true, reason: "Post is not publicly published" }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Idempotency guard via notification_deliveries
    const eventKey = `post_published:${record.id}`;
    const { error: idempErr } = await supabase
      .from("notification_deliveries")
      .insert({ event_key: eventKey, post_id: record.id, recipients_count: 0 });

    if (idempErr) {
      return new Response(JSON.stringify({ skipped: true, reason: "Duplicate notification prevented" }), { status: 200 });
    }

    const creatorId = record.authorId;
    const postTitle = record.title || "Untitled";

    const { data: creator } = await supabase
      .from("User")
      .select("username, channel_name")
      .eq("id", creatorId)
      .single();

    const creatorName = creator?.channel_name || creator?.username || "A creator you follow";

    const { data: followers, error: followError } = await supabase
      .from("Follow")
      .select("followerId")
      .eq("followingId", creatorId);

    if (followError) throw followError;
    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify({ message: "No followers found" }), { status: 200 });
    }

    const followerIds = [...new Set(followers.map((f) => f.followerId))].filter((fid) => fid !== creatorId);

    // Filter to active users with notifications enabled
    const { data: activeFollowers } = await supabase
      .from("User")
      .select("id, push_notifications_enabled")
      .in("id", followerIds)
      .eq("account_status", "active");

    const eligibleIds = (activeFollowers || []).map((u) => u.id);
    if (eligibleIds.length === 0) {
      return new Response(JSON.stringify({ message: "No eligible active followers" }), { status: 200 });
    }

    const notifRows = eligibleIds.map((fid) => ({
      id: crypto.randomUUID(),
      userId: fid,
      type: "NEW_POST",
      title: `${creatorName} published a new post`,
      message: postTitle,
      targetId: record.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

    await supabase.from("Notification").insert(notifRows);
    await supabase
      .from("notification_deliveries")
      .update({ recipients_count: eligibleIds.length })
      .eq("event_key", eventKey);

    const pushEnabledIds = (activeFollowers || [])
      .filter((u) => u.push_notifications_enabled !== false)
      .map((u) => u.id);

    if (pushEnabledIds.length === 0) {
      return new Response(JSON.stringify({ inAppSent: eligibleIds.length, pushSent: 0 }), { status: 200 });
    }

    const { data: devices } = await supabase
      .from("UserDevice")
      .select("pushToken")
      .in("userId", pushEnabledIds);

    const uniqueTokens = [...new Set((devices || []).map((d) => d.pushToken).filter(Boolean))];
    if (uniqueTokens.length === 0) {
      return new Response(JSON.stringify({ inAppSent: eligibleIds.length, pushSent: 0 }), { status: 200 });
    }

    const fcmProjectId = Deno.env.get("FCM_PROJECT_ID") ?? "";
    const fcmClientEmail = Deno.env.get("FCM_CLIENT_EMAIL") ?? "";
    const fcmPrivateKey = Deno.env.get("FCM_PRIVATE_KEY")?.replace(/\\n/g, "\n") ?? "";

    if (!fcmProjectId || !fcmClientEmail || !fcmPrivateKey) {
      return new Response(JSON.stringify({ inAppSent: eligibleIds.length, pushSkipped: "FCM secrets missing" }), { status: 200 });
    }

    const jwt = await new jose.SignJWT({
      iss: fcmClientEmail,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "RS256" })
      .sign(await jose.importPKCS8(fcmPrivateKey, "RS256"));

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const { access_token } = await tokenResponse.json();
    if (!access_token) throw new Error("FCM access_token is empty");

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`;
    let success = 0;
    let failed = 0;
    const staleTokens: string[] = [];

    await Promise.all(
      uniqueTokens.map(async (token) => {
        const res = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: `${creatorName} published a new post`,
                body: postTitle,
              },
              data: {
                postId: record.id,
                slug: record.slug || "",
                language: record.language || "en",
                screen: "ArticleDetail",
              },
              android: { priority: "high" },
              apns: { payload: { aps: { sound: "default" } } },
            },
          }),
        });

        if (res.ok) {
          success++;
        } else {
          failed++;
          const errData = await res.json().catch(() => ({}));
          const errCode = JSON.stringify(errData);
          if (errCode.includes("UNREGISTERED") || errCode.includes("NOT_FOUND")) {
            staleTokens.push(token);
          }
        }
      })
    );

    if (staleTokens.length > 0) {
      await supabase.from("UserDevice").delete().in("pushToken", staleTokens);
    }

    return new Response(JSON.stringify({ inAppSent: eligibleIds.length, pushSuccess: success, pushFailed: failed, pruned: staleTokens.length }), { status: 200 });
  } catch (err: any) {
    console.error("[NOTIFY] Fatal error:", err?.message);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), { status: 500 });
  }
});
