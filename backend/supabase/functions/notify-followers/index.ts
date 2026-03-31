// @ts-nocheck
/**
 * SUPABASE EDGE FUNCTION: notify-followers
 * 
 * Final optimized version with robust deduplication and redirection.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as jose from "https://esm.sh/jose@4.14.4";

serve(async (req: Request) => {
  console.log("[NOTIFY] Function v3 Invoked. Timestamp:", new Date().toISOString());
  
  try {
    const body = await req.json();
    console.log("[NOTIFY] Incoming JSON Payload:", JSON.stringify(body, null, 2));

    // Support both direct 'record' and the standard 'payload' structure from Supabase webhooks
    const record = body.record || body.payload || body;
    
    if (!record || Object.keys(record).length === 0) {
      console.error("[NOTIFY] Received an empty or invalid payload.");
      return new Response(JSON.stringify({ error: "Missing record or payload content" }), { status: 400 });
    }

    const creatorId = record.authorId;
    if (!creatorId) {
      console.warn("[NOTIFY] No 'authorId' found in record.");
      return new Response(JSON.stringify({ error: "Missing authorId" }), { status: 400 });
    }

    // 1. Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const fcmProjectId = Deno.env.get("FCM_PROJECT_ID") ?? "";
    const fcmClientEmail = Deno.env.get("FCM_CLIENT_EMAIL") ?? "";
    const fcmPrivateKey = Deno.env.get("FCM_PRIVATE_KEY")?.replace(/\\n/g, '\n') ?? "";

    const postTitle = record.title || "Untitled";

    // 2. Fetch Creator Profile
    const { data: creator } = await supabase
      .from("User")
      .select("username")
      .eq("id", creatorId)
      .single();
    
    const creatorName = creator?.username || "A creator you follow";

    // 3. Fetch unique followers
    const { data: followers, error: followError } = await supabase
      .from("Follow")
      .select("followerId")
      .eq("followingId", creatorId);

    if (followError) {
      console.error("[NOTIFY] Fetch followers error:", followError);
      throw followError;
    }

    if (!followers || followers.length === 0) {
      console.log("[NOTIFY] No followers found for creator:", creatorId);
      return new Response(JSON.stringify({ message: "No followers found" }), { status: 200 });
    }

    // Deduplicate follower IDs
    const followerIds = [...new Set(followers.map(f => f.followerId))];
    console.log(`[NOTIFY] Found ${followerIds.length} unique followers.`);

    // 4. Create In-App Notifications (Deduplicated)
    const notifRows = followerIds.map((fid) => ({
      id: crypto.randomUUID(),
      userId: fid,
      type: "Post",
      title: `${creatorName} published a new post`,
      message: postTitle,
      targetId: record.id,
      isRead: false
    }));

    const { error: insertError } = await supabase.from("Notification").insert(notifRows);
    if (insertError) console.error("[NOTIFY] Notification insert error:", insertError);

    // 5. Fetch device tokens
    const { data: devices, error: deviceError } = await supabase
      .from("UserDevice")
      .select("pushToken")
      .in("userId", followerIds);

    if (deviceError) console.error("[NOTIFY] Device tokens error:", deviceError);

    if (!devices || devices.length === 0) {
      console.log("[NOTIFY] No device tokens found for followers.");
      return new Response(JSON.stringify({ message: "No tokens found" }), { status: 200 });
    }

    // Deduplicate tokens
    const uniqueTokens = [...new Set(devices.map(d => d.pushToken).filter(Boolean))];
    console.log(`[NOTIFY] Sending push to ${uniqueTokens.length} unique tokens.`);

    // 6. Send to FCM v1 API
    if (fcmProjectId && fcmClientEmail && fcmPrivateKey) {
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

      await Promise.all(uniqueTokens.map(async (token) => {
        const message = {
          message: {
            token,
            notification: {
              title: `${creatorName} published a new post`,
              body: postTitle
            },
            data: {
              postId: record.id
              // We could add 'screen': 'Notifications' here if we wanted the function to tell the app where to go
            },
            android: { priority: "high" },
            apns: { payload: { aps: { sound: "default" } } }
          }
        };

        const res = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify(message),
        });

        if (res.ok) success++;
        else {
          failed++;
          const errData = await res.json();
          console.error(`[NOTIFY] FCM Send Error:`, JSON.stringify(errData));
        }
      }));

      console.log(`[NOTIFY] FCM Summary: ${success} sent, ${failed} failed.`);
      return new Response(JSON.stringify({ success, failed }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "FCM secrets missing" }), { status: 500 });

  } catch (err) {
    console.error("[NOTIFY] Fatal error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
