// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    if (token !== serviceKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: uData } = await userClient.auth.getUser();
      if (!uData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      const { data: prof } = await adminClient.from("User").select("role").eq("id", uData.user.id).maybeSingle();
      if (prof?.role !== "ADMIN") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { email, actionLink, oneTimePassword, loginUrl = "https://creator.postsapp.in/login", type = "otp" } = await req.json();

    if (!email || (!oneTimePassword && !actionLink)) {
      return new Response(
        JSON.stringify({ error: "Missing email or credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = Deno.env.get("EMAIL_USER");
    const pass = Deno.env.get("EMAIL_PASS");

    if (!user || !pass) {
      return new Response(
        JSON.stringify({
          sent: false,
          message: "SMTP credentials not configured; copy and share the one-time password directly.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const isReset = type === "recovery" || type === "otp_reset";
    const subject = oneTimePassword
      ? (isReset
        ? "PostsApp Creator Studio — Your New One-Time Password"
        : "Welcome to PostsApp Creator Studio — Your One-Time Login Credentials")
      : (isReset
        ? "PostsApp Creator Studio — Password Setup / Reset Link"
        : "Welcome to PostsApp Creator Studio — Complete Your Account Setup");

    const htmlBody = oneTimePassword
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #D4191F;">${isReset ? "Creator Studio One-Time Password Reset" : "Welcome to PostsApp Creator Studio"}</h2>
          <p>${isReset
            ? "An administrator has issued a new one-time password for your Creator Studio account."
            : "Your creator application has been approved! Sign in using your email and the one-time password below. You will be asked to create your own permanent password upon login."
          }</p>
          <div style="background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; font-size: 16px; color: #111827;"><strong>One-Time Password:</strong> <code style="background: #FFFFFF; padding: 4px 10px; border-radius: 6px; border: 1px solid #D1D5DB; font-weight: bold; letter-spacing: 1px;">${oneTimePassword}</code></p>
          </div>
          <div style="margin: 24px 0;">
            <a href="${loginUrl}" style="background-color: #D4191F; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Sign In to Creator Studio
            </a>
          </div>
          <p style="font-size: 12px; color: #6B7280;">This one-time password expires automatically after first use or in 48 hours.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #D4191F;">${isReset ? "Reset Your Creator Studio Password" : "Welcome to PostsApp Creator Studio"}</h2>
          <p>${isReset
            ? "An administrator has generated a secure password setup link for your Creator Studio account."
            : "Your creator application has been approved! Click the secure link below to set your password and activate your workspace."
          }</p>
          <div style="margin: 24px 0;">
            <a href="${actionLink}" style="background-color: #D4191F; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              ${isReset ? "Set New Password" : "Activate Creator Account"}
            </a>
          </div>
          <p style="font-size: 12px; color: #6B7280;">For security, this link expires automatically.</p>
        </div>
      `;

    const mailOptions = {
      from: `"PostsApp Editorial Admin" <${user}>`,
      to: email,
      subject,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ sent: true, message: "Invitation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error sending email:", err?.message);
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
