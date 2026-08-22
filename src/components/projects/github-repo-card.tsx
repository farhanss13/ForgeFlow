"use client";

import * as React from "react";
import { GitBranch, Link2, Link2Off, RefreshCw, AlertCircle, ExternalLink, Star, GitFork, Info, Calendar, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disconnectRepository, getGitHubRepositoryDetails } from "@/app/actions/github-actions";
import { type GitHubRepositoryDetails } from "@/lib/github/client";
import { GithubRepoSelector } from "./github-repo-selector";
import { GithubIssueSelector } from "./github-issue-selector";

interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
}

interface GithubRepoCardProps {
  projectId: string;
  connectedRepo: GitHubRepository | null;
}

export function GithubRepoCard({ projectId, connectedRepo }: GithubRepoCardProps) {
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);
  const [isIssueSelectorOpen, setIsIssueSelectorOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Live repository details state
  const [details, setDetails] = React.useState<GitHubRepositoryDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = React.useState(false);

  const loadDetails = React.useCallback(async () => {
    if (!connectedRepo) return;
    setIsDetailsLoading(true);
    setErrorMsg(null);

    const res = await getGitHubRepositoryDetails(projectId);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.details) {
      setDetails(res.details);
    }
    setIsDetailsLoading(false);
  }, [projectId, connectedRepo]);

  React.useEffect(() => {
    if (connectedRepo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDetails();
    } else {
      setDetails(null);
    }
  }, [connectedRepo, loadDetails]);

  const handleDisconnect = async () => {
    if (isPending) return;
    setIsPending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await disconnectRepository(projectId);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      setSuccessMsg("Repository connection removed successfully!");
      setDetails(null);
    }
    setIsPending(false);
  };

  const formatMonthYear = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="p-6 bg-card/30 backdrop-blur-md border border-border rounded-xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
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
            <h3 className="font-semibold text-lg text-foreground">GitHub Repository</h3>
            <p className="text-xs text-muted-foreground">
              Connect this ForgeFlow project to a GitHub repository to enable workspace maps.
            </p>
          </div>
        </div>

        {connectedRepo && !isSelectorOpen && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isDetailsLoading || isPending}
            onClick={loadDetails}
            className="h-8 gap-1 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
            title="Reload repository statistics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDetailsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Action status notification */}
      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 text-xs rounded-lg font-medium flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isDetailsLoading && (
        <div className="space-y-4 py-2 border-t border-border/30 pt-4">
          <div className="h-5 bg-muted/60 animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted/40 animate-pulse rounded w-2/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="h-14 bg-muted/30 animate-pulse rounded-lg" />
            <div className="h-14 bg-muted/30 animate-pulse rounded-lg" />
            <div className="h-14 bg-muted/30 animate-pulse rounded-lg" />
            <div className="h-14 bg-muted/30 animate-pulse rounded-lg" />
          </div>
        </div>
      )}

      {/* Connected repo view details */}
      {connectedRepo && !isDetailsLoading && (
        <div className="space-y-4 border-t border-border/30 pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {connectedRepo.ownerLogin} / <span className="text-primary font-mono">{connectedRepo.name}</span>
              </span>
              <span className="text-[9px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono font-bold uppercase">
                {details?.visibility || "Public"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-normal max-w-2xl">
              {details?.description || connectedRepo.description || "No description provided."}
            </p>
          </div>

          {/* Repository live metrics grid */}
          {details && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/30 flex items-center gap-3">
                <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Stars</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{details.stars}</p>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/30 flex items-center gap-3">
                <GitFork className="h-4 w-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Forks</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{details.forks}</p>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/30 flex items-center gap-3">
                <Info className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Issues</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{details.openIssues}</p>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/30 flex items-center gap-3">
                <Code className="h-4 w-4 text-purple-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Language</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate">{details.language || "Not detected"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sync timeline markers */}
          {details && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5 text-primary" /> Branch: <strong className="font-mono text-foreground">{details.defaultBranch}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Created: <strong className="text-foreground">{formatMonthYear(details.createdAt)}</strong>
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Updated: <strong className="text-foreground">{formatMonthYear(details.updatedAt)}</strong>
              </span>
              {details.isFork && (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <Shield className="h-3.5 w-3.5" /> Forked Repository
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <a
              href={connectedRepo.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 border border-border bg-background hover:bg-muted text-foreground text-xs rounded-lg font-medium select-none cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open on GitHub
            </a>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIssueSelectorOpen(true)}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              <Info className="h-3.5 w-3.5" /> Import Issues
            </Button>

            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDisconnect}
              className="gap-1.5 cursor-pointer text-xs h-8"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Disconnecting...
                </>
              ) : (
                <>
                  <Link2Off className="h-3.5 w-3.5" /> Disconnect Repository
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Disconnected state */}
      {!connectedRepo && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground max-w-md">
            No repository mapped to this project workspace. Select a public repository to link them.
          </p>
          <Button
            size="sm"
            onClick={() => setIsSelectorOpen(true)}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <Link2 className="h-3.5 w-3.5" /> Connect Repository
          </Button>
        </div>
      )}

      {/* Selector dialog component */}
      <GithubRepoSelector
        projectId={projectId}
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onConnected={() => {
          setSuccessMsg("Repository connected successfully!");
          setErrorMsg(null);
          loadDetails();
        }}
      />

      {/* Issues selector dialog */}
      <GithubIssueSelector
        projectId={projectId}
        isOpen={isIssueSelectorOpen}
        onClose={() => setIsIssueSelectorOpen(false)}
      />
    </div>
  );
}

