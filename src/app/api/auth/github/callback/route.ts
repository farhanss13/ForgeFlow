import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.GITHUB_CALLBACK_URL 
    ? new URL(process.env.GITHUB_CALLBACK_URL).origin 
    : "http://localhost:3000";

  try {
    // 1. Verify that a ForgeFlow user session currently exists
    const user = await getCurrentUser();
    if (!user) {
      console.error("No authenticated ForgeFlow user found in session during callback");
      return NextResponse.redirect(new URL("/login?error=session_expired", baseUrl));
    }

    // 2. Parse OAuth parameters from redirect URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // 3. Retrieve state token from cookies
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("github_oauth_state")?.value;

    // 4. Invalidate / delete state cookie immediately
    cookieStore.delete("github_oauth_state");

    // 5. CSRF State validations
    if (!state || !stateCookie || state !== stateCookie) {
      console.error("CSRF state mismatch or cookie expired");
      return NextResponse.redirect(new URL("/settings?error=csrf_validation_failed", baseUrl));
    }

    if (!code) {
      console.error("Missing authorization code from GitHub callback redirect");
      return NextResponse.redirect(new URL("/settings?error=code_missing", baseUrl));
    }

    // 6. Exchange authorization code for an Access Token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("GitHub token exchange request failed:", tokenResponse.statusText);
      return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", baseUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("GitHub access token not returned in payload response:", tokenData);
      return NextResponse.redirect(new URL("/settings?error=token_missing", baseUrl));
    }

    // 7. Call GitHub API to fetch user profile identity details
    const userProfileResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ForgeFlow-App",
      },
    });

    if (!userProfileResponse.ok) {
      console.error("GitHub profile request failed:", userProfileResponse.statusText);
      return NextResponse.redirect(new URL("/settings?error=profile_fetch_failed", baseUrl));
    }

    const profileData = await userProfileResponse.json();
    const githubUserId = profileData.id?.toString();
    const githubUsername = profileData.login;

    if (!githubUserId || !githubUsername) {
      console.error("Incomplete GitHub user details returned from API:", profileData);
      return NextResponse.redirect(new URL("/settings?error=identity_invalid", baseUrl));
    }

    // 8. Prevent duplicate connections to multiple ForgeFlow users
    const existingConnection = await prisma.gitHubConnection.findUnique({
      where: { githubUserId }
    });

    if (existingConnection && existingConnection.userId !== user.id) {
      console.warn(`GitHub account ${githubUsername} is already linked to another ForgeFlow user profile`);
      return NextResponse.redirect(new URL("/settings?error=github_already_linked", baseUrl));
    }

    // 9. Save or update the GitHubConnection in DB associated with current user
    await prisma.gitHubConnection.upsert({
      where: { userId: user.id },
      update: {
        githubUserId,
        githubUsername,
        accessToken,
      },
      create: {
        userId: user.id,
        githubUserId,
        githubUsername,
        accessToken,
      },
    });

    // 10. Redirect to settings with success status
    return NextResponse.redirect(new URL("/settings?success=github_connected", baseUrl));
  } catch (error) {
    console.error("Uncaught error during GitHub OAuth callback processing:", error);
    return NextResponse.redirect(new URL("/settings?error=callback_failed", baseUrl));
  }
}
