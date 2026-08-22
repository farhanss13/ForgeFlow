"use client";

import * as React from "react";
import { Search, X, Loader2, GitPullRequest, ArrowLeft, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGitHubIssues, importGitHubIssue } from "@/app/actions/github-actions";
import { type GitHubIssueDTO } from "@/lib/github/client";
import { cn } from "@/lib/utils";

interface GithubIssueSelectorProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type IssueStateFilter = "open" | "closed" | "all";

export function GithubIssueSelector({
  projectId,
  isOpen,
  onClose,
  onImported,
}: GithubIssueSelectorProps) {
  const [issues, setIssues] = React.useState<GitHubIssueDTO[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState<number | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  
  // Pagination & Filter States
  const [page, setPage] = React.useState(1);
  const [filterState, setFilterState] = React.useState<IssueStateFilter>("all");

  const loadIssues = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await getGitHubIssues(projectId, page, filterState);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIssues(res.issues);
    }
    setIsLoading(false);
  }, [projectId, page, filterState]);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadIssues();
    } else {
      setSearchQuery("");
      setErrorMsg(null);
      setSuccessMsg(null);
      setPage(1);
      setFilterState("all");
    }
  }, [isOpen, page, filterState, loadIssues]);

  const handleImport = async (issueNumber: number) => {
    if (isImporting !== null) return;
    setIsImporting(issueNumber);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await importGitHubIssue(projectId, issueNumber);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      if (res.alreadyImported) {
        setSuccessMsg(`Issue #${issueNumber} was already imported.`);
      } else {
        setSuccessMsg(`Issue #${issueNumber} successfully imported as Task!`);
      }
      // Re-load the list to mark it as alreadyImported
      await loadIssues();
      if (onImported) {
        onImported();
      }
    }
    setIsImporting(null);
  };

  if (!isOpen) return null;

  // Search locally on the currently loaded page
  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.number.toString().includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-xl p-6 rounded-xl border border-border shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div>
            <h3 className="text-lg font-bold text-foreground">Import GitHub Issues</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse issues from your connected repository and import them as tasks.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 text-xs rounded-lg font-medium flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search, Filter, State Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search current page issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterState}
              onChange={(e) => {
                setFilterState(e.target.value as IssueStateFilter);
                setPage(1);
              }}
              className="bg-background border border-input text-foreground text-xs rounded-lg p-2 focus:ring-ring focus:border-input outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>

            <Button
              variant="ghost"
              size="icon"
              onClick={loadIssues}
              disabled={isLoading}
              title="Refresh issues list"
              className="border border-border cursor-pointer shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Issues List Box */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 min-h-[220px]">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs font-medium">Fetching issues from GitHub...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <GitPullRequest className="h-8 w-8 opacity-40 mb-2" />
              <p className="text-xs font-semibold">No issues found on this page</p>
              <p className="text-[10px] opacity-75 max-w-[220px] mt-0.5">
                {searchQuery ? "Try clearing your search query filter." : "There are no issues matching the state filter."}
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-3.5 bg-background/40 hover:bg-background/80 border border-border/55 hover:border-border rounded-xl flex items-start justify-between gap-4 transition-colors"
              >
                <div className="space-y-1 overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-xs font-bold text-foreground hover:text-primary transition-colors leading-normal block">
                      #{issue.number} {issue.title}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider",
                        issue.state === "open"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}
                    >
                      {issue.state}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Opened by <strong className="text-foreground">{issue.userLogin}</strong> on {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                  {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {issue.labels.map((label) => (
                        <span
                          key={label}
                          className="text-[9px] bg-secondary/80 text-secondary-foreground px-1.5 py-0.5 rounded font-semibold"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-0.5">
                  {issue.alreadyImported ? (
                    <span className="text-[10px] text-green-600 dark:text-green-500 font-bold border border-green-500/20 bg-green-500/5 px-2.5 py-1 rounded-lg select-none">
                      Imported
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isImporting !== null}
                      onClick={() => handleImport(issue.number)}
                      className="h-7 text-[10px] px-2.5 font-bold cursor-pointer gap-1"
                    >
                      {isImporting === issue.number ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Importing
                        </>
                      ) : (
                        "Import"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-semibold">
            * Search query operates only on the current page.
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
              disabled={issues.length < 30 || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 w-7 p-0 cursor-pointer shrink-0 border border-border"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
