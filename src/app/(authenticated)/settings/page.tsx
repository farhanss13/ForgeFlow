import { requireProfile } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { GithubIntegrationCard } from "@/components/settings/github-integration-card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  // Retrieve current user's GitHub Connection username (excluding tokens)
  const connection = await prisma.gitHubConnection.findUnique({
    where: { userId: profile.id },
    select: { githubUsername: true },
  });

  // Map incoming URL error codes to user-friendly messages
  const getErrorMessage = (code: string) => {
    switch (code) {
      case "csrf_validation_failed":
        return "State token validation failed. Unauthorized login block activated.";
      case "github_already_linked":
        return "This GitHub account is already connected to another ForgeFlow user profile.";
      case "github_config_missing":
        return "Server config error: GitHub application parameters are not configured.";
      case "token_exchange_failed":
        return "Failed to exchange authorization code for GitHub access token.";
      case "profile_fetch_failed":
        return "Failed to retrieve user profile credentials from GitHub API.";
      default:
        return "GitHub connection failed. Please try again.";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace account preferences and third-party integrations.</p>
      </div>

      {/* Query status logs */}
      {params.error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium flex items-start gap-2.5 max-w-xl">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{getErrorMessage(params.error)}</span>
        </div>
      )}

      {params.success === "github_connected" && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm rounded-xl font-medium flex items-start gap-2.5 max-w-xl">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>GitHub account connected successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 max-w-xl">
        {/* Account Info */}
        <div className="p-6 bg-card/30 backdrop-blur-md border border-border rounded-xl shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Account Information</h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2.5 border-b border-border/40">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium text-foreground">{profile.fullName || "Not provided"}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/40">
              <span className="text-muted-foreground">Email Address</span>
              <span className="font-medium text-foreground">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono text-xs text-muted-foreground">{profile.id}</span>
            </div>
          </div>
        </div>

        {/* GitHub Integration Card */}
        <GithubIntegrationCard username={connection?.githubUsername || null} />
      </div>
    </div>
  );
}
