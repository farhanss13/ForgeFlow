import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import crypto from "crypto";

export async function GET() {
  try {
    // 1. Verify user is authenticated with ForgeFlow
    const user = await getCurrentUser();
    if (!user) {
      const baseUrl = process.env.GITHUB_CALLBACK_URL 
        ? new URL(process.env.GITHUB_CALLBACK_URL).origin 
        : "http://localhost:3000";
      return NextResponse.redirect(new URL("/login", baseUrl));
    }

    // 2. Generate secure state token for CSRF protection
    const state = crypto.randomBytes(16).toString("hex");

    // 3. Set httpOnly state validation cookie
    const cookieStore = await cookies();
    cookieStore.set("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      console.error("GITHUB_CLIENT_ID env variable is missing");
      const baseUrl = process.env.GITHUB_CALLBACK_URL 
        ? new URL(process.env.GITHUB_CALLBACK_URL).origin 
        : "http://localhost:3000";
      return NextResponse.redirect(new URL("/settings?error=github_config_missing", baseUrl));
    }

    // 4. Redirect to GitHub OAuth Authorization Page
    const callbackUrl = process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&state=${state}&scope=read:user`;

    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error("Failed to initiate GitHub OAuth:", error);
    const baseUrl = process.env.GITHUB_CALLBACK_URL 
      ? new URL(process.env.GITHUB_CALLBACK_URL).origin 
      : "http://localhost:3000";
    return NextResponse.redirect(new URL("/settings?error=initiation_failed", baseUrl));
  }
}
