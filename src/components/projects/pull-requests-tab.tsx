"use client";

import * as React from "react";
import { GitPullRequest, Search, RefreshCw, AlertCircle, ExternalLink, ArrowLeft, ArrowRight, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGitHubPullRequests } from "@/app/actions/github-actions";
import { type GitHubPullRequestDTO } from "@/lib/github/client";
import { cn } from "@/lib/utils";

interface PullRequestsTabProps {
  projectId: string;
}

type PRStateFilter = "open" | "closed" | "all";

export function PullRequestsTab({ projectId }: PullRequestsTabProps) {
  const [pulls, setPulls] = React.useState<GitHubPullRequestDTO[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Pagination & Filter States
  const [page, setPage] = React.useState(1);
  const [filterState, setFilterState] = React.useState<PRStateFilter>("all");

  const loadPullRequests = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await getGitHubPullRequests(projectId, page, filterState);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setPulls(res.pullRequests);
    }
    setIsLoading(false);
  }, [projectId, page, filterState]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPullRequests();
  }, [loadPullRequests]);

  // Client-side filtering on current page
  const filteredPulls = pulls.filter(
    (pr) =>
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
            <GitPullRequest className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">GitHub Pull Requests</h3>
            <p className="text-xs text-muted-foreground">
              Monitor development activities and branches connected to this workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search loaded page PRs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-4 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value as PRStateFilter);
              setPage(1);
            }}
            className="bg-background border border-input text-foreground text-xs rounded-lg p-2 focus:ring-ring focus:border-input outline-none cursor-pointer h-9"
          >
            <option value="all">All PRs</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadPullRequests}
            disabled={isLoading}
            title="Refresh Pull Requests list"
            className="border border-border cursor-pointer shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* State alerts */}
      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Failed to Retrieve Pull Requests</p>
            <p className="text-xs opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Skeletons loader */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 bg-card/25 border border-border/40 rounded-xl space-y-3.5">
              <div className="flex justify-between items-start">
                <div className="h-5 bg-muted/60 animate-pulse rounded w-1/3" />
                <div className="h-5 bg-muted/50 animate-pulse rounded w-16" />
              </div>
              <div className="h-4 bg-muted/30 animate-pulse rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredPulls.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-border/70 rounded-2xl text-center text-muted-foreground">
          <GitPullRequest className="h-10 w-10 opacity-30 mb-3 text-purple-500" />
          <p className="text-sm font-semibold">No Pull Requests found</p>
          <p className="text-xs opacity-75 max-w-[280px] mt-0.5">
            {searchQuery
              ? "No items match your page search filter."
              : "Verify that there are Pull Requests created in this GitHub repository."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPulls.map((pr) => {
            // Determine premium badges
            let badgeStyle = "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
            let badgeLabel = "Open";
            
            if (pr.mergedAt) {
              badgeStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
              badgeLabel = "Merged";
            } else if (pr.draft) {
              badgeStyle = "bg-muted text-muted-foreground border border-border";
              badgeLabel = "Draft";
            } else if (pr.state === "closed") {
              badgeStyle = "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
              badgeLabel = "Closed";
            }

            return (
              <div
                key={pr.id}
                className="p-5 bg-card/30 hover:bg-card/65 border border-border/60 hover:border-border rounded-xl flex items-start justify-between gap-5 transition-all shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-bold text-foreground leading-snug truncate max-w-xl">
                      #{pr.number} {pr.title}
                    </span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", badgeStyle)}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Created by <strong className="text-foreground">{pr.userLogin}</strong> on {new Date(pr.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                      {pr.headBranch}
                    </span>
                    <span className="text-[10px]">to</span>
                    <span className="flex items-center gap-1 font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                      {pr.baseBranch}
                    </span>
                  </div>

                  {pr.body && (
                    <p className="text-xs text-muted-foreground truncate max-w-2xl pt-1">
                      {pr.body}
                    </p>
                  )}

                  {pr.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {pr.labels.map((label) => (
                        <span
                          key={label}
                          className="text-[9px] bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full font-semibold border border-border"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {pr.mergedAt && <GitMerge className="h-4 w-4 text-purple-500" />}
                  <a
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 h-8 px-3 border border-border bg-background hover:bg-muted text-foreground text-xs rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination control */}
      {pulls.length > 0 && !isLoading && (
        <div className="flex items-center justify-between border-t border-border/30 pt-4">
          <p className="text-[10px] text-muted-foreground font-semibold">
            * Search query operates only on the currently loaded page results.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 cursor-pointer shrink-0 border border-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-bold text-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pulls.length < 30 || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 w-7 p-0 cursor-pointer shrink-0 border border-border"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
