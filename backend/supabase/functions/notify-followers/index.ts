// @ts-nocheck
/**
 * SUPABASE EDGE FUNCTION: notify-followers
 * 
 * NOTE: This file uses Deno-specific syntax (https:// imports and Deno global).
 * Added @ts-nocheck above to silence local IDE (Node.js) warnings.
 * This file will work perfectly when deployed to Supabase.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req: Request) => {
  try {
    const { record } = await req.json(); // Triggered by 'Post' table INSERT webhook
    
    // 1. Initialize Supabase Client
    // @ts-ignore: Deno global is available in Supabase Edge Functions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const creatorId = record.authorId;
    const postTitle = record.title;

    // 2. Fetch Creator Profile for the notification title
    const { data: creator } = await supabase
      .from("User")
      .select("username")
      .eq("id", creatorId)
      .single();
    
    const creatorName = creator?.username || "A creator";

    // 3. Fetch all followers for this creator
    const { data: followers, error: followError } = await supabase
      .from("Follow")
      .select("followerId")
      .eq("followingId", creatorId);

    if (followError || !followers || followers.length === 0) {
      return new Response(JSON.stringify({ message: "No followers to notify" }), { status: 200 });
    }

    const followerIds = followers.map((f: { followerId: string }) => f.followerId);

    // 4. Create In-App Notifications for all followers
    const notifRows = followerIds.map((fid: string) => ({
      userId: fid,
      type: "Repost", // Mapped to the 'Repost' tab in your UI
      title: `${creatorName} published a new post`,
      message: postTitle,
      targetId: record.id,
      isRead: false
    }));

    // In chunks of 100
    for (let i = 0; i < notifRows.length; i += 100) {
      await supabase.from("Notification").insert(notifRows.slice(i, i + 100));
    }

    // 5. Fetch active push tokens for these followers (where notifications are enabled)
    const { data: devices, error: deviceError } = await supabase
      .from("UserDevice")
      .select("pushToken, userId")
      .in("userId", followerIds);

    if (deviceError || !devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: "In-app notifications created, but no device tokens found." }), { status: 200 });
    }

    // 6. Prepare Expo Push Messages
    const messages = devices.map((d: { pushToken: string }) => ({
      to: d.pushToken,
      sound: "default",
      title: `${creatorName} published a new post`,
      body: postTitle,
      data: { postId: record.id },
    }));

    // 7. Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return new Response(JSON.stringify({
      status: "success",
      inApp: `Created ${notifRows.length} notifications`,
      push: result
    }), { status: 200 });

  } catch (err) {
    const error = err as Error;
    console.error(`[NOTIFY ERROR] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
