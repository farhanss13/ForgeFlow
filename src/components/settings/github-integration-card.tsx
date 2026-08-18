"use client";

import * as React from "react";
import Link from "next/link";
import { Link2, Link2Off, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { disconnectGithub } from "@/app/actions/integration-actions";
import { cn } from "@/lib/utils";

interface GithubIntegrationCardProps {
  username: string | null;
}

export function GithubIntegrationCard({ username }: GithubIntegrationCardProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleDisconnect = async () => {
    if (isPending) return;
    setIsPending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await disconnectGithub();
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      setSuccessMsg("GitHub disconnected successfully!");
    }
    setIsPending(false);
  };

  return (
    <div className="p-6 bg-card/30 backdrop-blur-md border border-border rounded-xl shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg text-foreground">
          {/* Custom inline GitHub SVG */}
          <svg
            className="h-6 w-6 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">GitHub Integration</h3>
          <p className="text-xs text-muted-foreground">
            Connect your GitHub profile to link repositories and sync task cards.
          </p>
        </div>
      </div>

      {/* Alert logs */}
      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 text-xs rounded-lg font-medium flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/30">
        {username ? (
          <>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider block">
                Connected
              </span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                GitHub Username: <strong className="font-mono text-primary">@{username}</strong>
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDisconnect}
              className="gap-1.5 cursor-pointer text-xs"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Disconnecting...
                </>
              ) : (
                <>
                  <Link2Off className="h-3.5 w-3.5" /> Disconnect GitHub
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground max-w-md">
              No account connected. Connect your account to enable issues and repository mapping features.
            </p>
            <a
              href="/api/auth/github/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-1.5 cursor-pointer text-xs"
              )}
            >
              <Link2 className="h-3.5 w-3.5" /> Connect GitHub
            </a>
          </>
        )}
      </div>
    </div>
  );
}
