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
