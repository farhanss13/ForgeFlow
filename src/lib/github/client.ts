import prisma from "@/lib/prisma";

export interface GitHubRepositoryDTO {
  id: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
}

/**
 * Retrieves the stored GitHub OAuth access token for a given user.
 */
export async function getGithubToken(userId: string): Promise<string> {
  const connection = await prisma.gitHubConnection.findUnique({
    where: { userId },
    select: { accessToken: true },
  });

  if (!connection || !connection.accessToken) {
    throw new Error("GitHub account is not connected.");
  }

  return connection.accessToken;
}

/**
 * Lists repositories accessible to the connected GitHub account.
 */
export async function fetchGitHubRepositories(userId: string): Promise<GitHubRepositoryDTO[]> {
  const token = await getGithubToken(userId);

  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ForgeFlow-App",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("GitHub credentials expired or invalid. Please reconnect.");
    }
    throw new Error(`GitHub API returned error status ${response.status}`);
  }

  const repos = await response.json();

  if (!Array.isArray(repos)) {
    return [];
  }

  // Map and filter only public repositories to match the public_repo scope limitation
  return repos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((repo: any) => !repo.private) // Enforce MVP constraint to only map public repositories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      ownerLogin: repo.owner?.login || "",
      htmlUrl: repo.html_url,
      description: repo.description || null,
      defaultBranch: repo.default_branch || "main",
      isPrivate: repo.private,
    }));
}

/**
 * Verifies that a specific repository exists and is accessible to the user's connection.
 */
export async function verifyRepositoryAccess(
  userId: string,
  owner: string,
  repoName: string
): Promise<GitHubRepositoryDTO> {
  const token = await getGithubToken(userId);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ForgeFlow-App",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository not found or inaccessible under public scope permissions.");
    }
    throw new Error(`GitHub verification failed with status ${response.status}`);
  }

  const repo = await response.json();

  return {
    id: repo.id.toString(),
    name: repo.name,
    fullName: repo.full_name,
    ownerLogin: repo.owner?.login || "",
    htmlUrl: repo.html_url,
    description: repo.description || null,
    defaultBranch: repo.default_branch || "main",
    isPrivate: repo.private,
  };
}

export interface GitHubRepositoryDetails {
  id: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  visibility: string;
  isFork: boolean;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches current repository statistics and details from GitHub API.
 */
export async function fetchGitHubRepositoryDetails(
  userId: string,
  owner: string,
  repoName: string
): Promise<GitHubRepositoryDetails> {
  const token = await getGithubToken(userId);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ForgeFlow-App",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("GitHub connection needs to be renewed.");
    }
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit reached. Please try again later.");
      }
      throw new Error("GitHub API access forbidden or permission denied.");
    }
    if (response.status === 404) {
      throw new Error("This repository is no longer available.");
    }
    throw new Error("Unable to retrieve repository information right now. Please try again.");
  }

  const repo = await response.json();

  return {
    id: repo.id.toString(),
    name: repo.name,
    fullName: repo.full_name,
    ownerLogin: repo.owner?.login || "",
    htmlUrl: repo.html_url,
    description: repo.description || null,
    defaultBranch: repo.default_branch || "main",
    visibility: repo.private ? "Private" : "Public",
    isFork: !!repo.fork,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    openIssues: repo.open_issues_count || 0,
    language: repo.language || null,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
  };
}

export interface GitHubIssueDTO {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  userLogin: string;
  labels: string[];
  alreadyImported?: boolean;
}

/**
 * Fetches paginated issues from the connected GitHub repository (excluding Pull Requests).
 */
export async function fetchGitHubIssues(
  userId: string,
  owner: string,
  repo: string,
  page: number = 1,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubIssueDTO[]> {
  const token = await getGithubToken(userId);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?per_page=30&page=${page}&state=${state}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ForgeFlow-App",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("GitHub connection needs to be renewed.");
    }
    throw new Error(`GitHub API returned error status ${response.status}`);
  }

  const items = await response.json();

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    // Exclude Pull Requests (GitHub Issues API returns both issues and PRs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => !item.pull_request)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => ({
      id: item.id.toString(),
      number: item.number,
      title: item.title,
      body: item.body || null,
      state: item.state,
      htmlUrl: item.html_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      closedAt: item.closed_at || null,
      userLogin: item.user?.login || "unknown",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      labels: Array.isArray(item.labels) ? item.labels.map((l: any) => l.name) : [],
    }));
}

/**
 * Fetches a single issue from the connected GitHub repository and verifies it is not a PR.
 */
export async function fetchSingleGitHubIssue(
  userId: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssueDTO> {
  const token = await getGithubToken(userId);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ForgeFlow-App",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Issue #${issueNumber} not found in the connected repository.`);
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const item = await response.json();

  if (item.pull_request) {
    throw new Error("The specified work item is a Pull Request, not a GitHub Issue.");
  }

  return {
    id: item.id.toString(),
    number: item.number,
    title: item.title,
    body: item.body || null,
    state: item.state,
    htmlUrl: item.html_url,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    closedAt: item.closed_at || null,
    userLogin: item.user?.login || "unknown",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labels: Array.isArray(item.labels) ? item.labels.map((l: any) => l.name) : [],
  };
}


