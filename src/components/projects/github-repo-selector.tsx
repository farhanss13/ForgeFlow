"use client";

import * as React from "react";
import { Search, X, Loader2, GitFork, Link2, AlertCircle, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getGitHubRepositories, connectRepository } from "@/app/actions/github-actions";
import { type GitHubRepositoryDTO } from "@/lib/github/client";
import { cn } from "@/lib/utils";

interface GithubRepoSelectorProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function GithubRepoSelector({
  projectId,
  isOpen,
  onClose,
  onConnected,
}: GithubRepoSelectorProps) {
  const [repositories, setRepositories] = React.useState<GitHubRepositoryDTO[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isConnectedToGithub, setIsConnectedToGithub] = React.useState(true);

  const loadRepos = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsConnectedToGithub(true);

    const res = await getGitHubRepositories();
    if (!res.connected) {
      setIsConnectedToGithub(false);
    } else if (res.error) {
      setErrorMsg(res.error);
    } else {
      setRepositories(res.repositories);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRepos();
    } else {
      setSearchQuery("");
      setErrorMsg(null);
    }
  }, [isOpen, loadRepos]);

  const handleConnect = async (repo: GitHubRepositoryDTO) => {
    if (isConnecting) return;
    setIsConnecting(repo.id);
    setErrorMsg(null);

    const res = await connectRepository(projectId, repo);
    if (res.error) {
      setErrorMsg(res.error);
      setIsConnecting(null);
    } else if (res.success) {
      setIsConnecting(null);
      onConnected();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Client-side search implementation
  const filteredRepos = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div>
            <h3 className="text-lg font-bold text-foreground">Connect GitHub Repository</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select a repository to link with this project.</p>
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

        {/* State Banner Logging */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Disconnected state */}
        {!isConnectedToGithub && (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-[260px]">
              <p className="text-xs font-semibold text-foreground">GitHub Link Required</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect your account in account settings integrations before attempting to map repositories.
              </p>
            </div>
            <a
              href="/settings"
              className={cn(
                buttonVariants({ size: "sm" }),
                "cursor-pointer text-xs"
              )}
            >
              Go to Integrations
            </a>
          </div>
        )}

        {/* Connected state workspace lists */}
        {isConnectedToGithub && (
          <>
            {/* Search inputs */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search public repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Repositories selection body container */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 min-h-[200px]">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading repositories...</span>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <GitFork className="h-8 w-8 opacity-40 mb-2" />
                  <p className="text-xs font-medium">No public repositories found</p>
                  <p className="text-[10px] opacity-75 max-w-[200px] mt-0.5">
                    {searchQuery ? "Try clearing your search query filter." : "Verify you have public repositories on GitHub."}
                  </p>
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 bg-background/40 hover:bg-background/80 border border-border/60 hover:border-border rounded-lg flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                          {repo.name}
                        </span>
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono uppercase tracking-wider font-semibold">
                          Public
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {repo.fullName}
                      </p>
                      {repo.description && (
                        <p className="text-[10px] text-muted-foreground truncate leading-normal">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Button
                        size="sm"
                        disabled={isConnecting !== null}
                        onClick={() => handleConnect(repo)}
                        className="h-7 text-[10px] px-2 cursor-pointer font-semibold gap-1"
                      >
                        {isConnecting === repo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Link2 className="h-3 w-3" />
                        )}
                        Link
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
