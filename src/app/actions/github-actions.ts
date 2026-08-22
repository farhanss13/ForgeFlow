"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser, verifyProjectOwnership } from "@/lib/auth-helpers";
import { 
  fetchGitHubRepositories, 
  verifyRepositoryAccess, 
  fetchGitHubRepositoryDetails,
  fetchGitHubIssues,
  fetchSingleGitHubIssue,
  fetchGitHubPullRequests,
  type GitHubRepositoryDTO,
  type GitHubRepositoryDetails,
  type GitHubIssueDTO,
  type GitHubPullRequestDTO
} from "@/lib/github/client";

/**
 * Lists available public repositories connected to the user's active GitHub link.
 */
export async function getGitHubRepositories(): Promise<{
  connected: boolean;
  repositories: GitHubRepositoryDTO[];
  error: string | null;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { connected: false, repositories: [], error: "Unauthorized access." };
    }

    const connection = await prisma.gitHubConnection.findUnique({
      where: { userId: user.id },
    });

    if (!connection) {
      return { connected: false, repositories: [], error: null };
    }

    const repos = await fetchGitHubRepositories(user.id);
    return { connected: true, repositories: repos, error: null };
  } catch (error) {
    console.error("Failed to load GitHub repositories:", error);
    const errorMsg = error instanceof Error ? error.message : "Unable to load GitHub repositories. Please try again.";
    return { 
      connected: true, 
      repositories: [], 
      error: errorMsg.includes("credentials expired") 
        ? "GitHub connection needs to be renewed." 
        : "Unable to load GitHub repositories. Please try again." 
    };
  }
}

/**
 * Connects a verified GitHub repository to a ForgeFlow project.
 */
export async function connectRepository(
  projectId: string,
  repository: GitHubRepositoryDTO
): Promise<{ error: string | null; success: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized access.", success: false };
    }

    // 1. Verify that the ForgeFlow project belongs to the authenticated user
    await verifyProjectOwnership(projectId);

    // 2. Validate selected repository data server-side using the access token
    await verifyRepositoryAccess(user.id, repository.ownerLogin, repository.name);

    // 3. Upsert integration relationship in PostgreSQL
    await prisma.gitHubRepository.upsert({
      where: { projectId },
      update: {
        githubRepositoryId: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        ownerLogin: repository.ownerLogin,
        htmlUrl: repository.htmlUrl,
        description: repository.description,
        defaultBranch: repository.defaultBranch,
      },
      create: {
        projectId,
        githubRepositoryId: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        ownerLogin: repository.ownerLogin,
        htmlUrl: repository.htmlUrl,
        description: repository.description,
        defaultBranch: repository.defaultBranch,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to connect repository:", error);
    const errorMsg = error instanceof Error ? error.message : "GitHub connection failed. Please try again.";
    return { error: errorMsg, success: false };
  }
}

/**
 * Disconnects a linked GitHub repository from a ForgeFlow project.
 */
export async function disconnectRepository(
  projectId: string
): Promise<{ error: string | null; success: boolean }> {
  try {
    // 1. Verify project ownership
    await verifyProjectOwnership(projectId);

    // 2. Confirm repository is connected and delete it
    const existing = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    });

    if (!existing) {
      return { error: "No repository connected to this project.", success: false };
    }

    await prisma.gitHubRepository.delete({
      where: { projectId }
    });

    revalidatePath(`/projects/${projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to disconnect repository:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to disconnect repository. Please try again.";
    return { error: errorMsg, success: false };
  }
}

/**
 * Retrieves detailed live statistics and information for the repository connected to a project.
 */
export async function getGitHubRepositoryDetails(
  projectId: string
): Promise<{
  details: GitHubRepositoryDetails | null;
  error: string | null;
}> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return { details: null, error: "Unauthorized access." };
    }

    // 2. Verify project ownership
    await verifyProjectOwnership(projectId);

    // 3. Find connected repository details
    const linkedRepo = await prisma.gitHubRepository.findUnique({
      where: { projectId },
    });

    if (!linkedRepo) {
      return { details: null, error: "No GitHub repository connected." };
    }

    // 4. Retrieve live stats from GitHub using client helper
    const details = await fetchGitHubRepositoryDetails(
      user.id,
      linkedRepo.ownerLogin,
      linkedRepo.name
    );

    return { details, error: null };
  } catch (error) {
    console.error("Failed to fetch GitHub repository details:", error);
    const errorMsg = error instanceof Error ? error.message : "Unable to retrieve repository information right now. Please try again.";
    return { details: null, error: errorMsg };
  }
}

/**
 * Retrieves paginated issues from the project's connected repository.
 * Derives repository target exclusively from database to prevent parameter spoofing.
 */
export async function getGitHubIssues(
  projectId: string,
  page: number = 1,
  state: "open" | "closed" | "all" = "all"
): Promise<{
  issues: GitHubIssueDTO[];
  error: string | null;
}> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return { issues: [], error: "Unauthorized access." };
    }

    // 2. Verify project ownership
    await verifyProjectOwnership(projectId);

    // 3. Find connected repository details
    const linkedRepo = await prisma.gitHubRepository.findUnique({
      where: { projectId },
    });

    if (!linkedRepo) {
      return { issues: [], error: "No GitHub repository connected." };
    }

    // 4. Retrieve paginated list from GitHub API
    const issues = await fetchGitHubIssues(
      user.id,
      linkedRepo.ownerLogin,
      linkedRepo.name,
      page,
      state
    );

    // 5. Cross-reference existing imported issues in the database
    const issueIds = issues.map((i) => i.id);
    const existingImports = await prisma.task.findMany({
      where: {
        projectId,
        githubIssueId: { in: issueIds },
      },
      select: { githubIssueId: true },
    });

    const importedIds = new Set(existingImports.map((t) => t.githubIssueId));

    const mappedIssues = issues.map((i) => ({
      ...i,
      alreadyImported: importedIds.has(i.id),
    }));

    return { issues: mappedIssues, error: null };
  } catch (error) {
    console.error("Failed to fetch GitHub issues:", error);
    const errorMsg = error instanceof Error ? error.message : "Unable to retrieve issues right now.";
    return { issues: [], error: errorMsg };
  }
}

/**
 * Imports a selected GitHub Issue into the project workspace Kanban board as a TODO Task.
 */
export async function importGitHubIssue(
  projectId: string,
  issueNumber: number
): Promise<{
  success: boolean;
  alreadyImported: boolean;
  error: string | null;
}> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, alreadyImported: false, error: "Unauthorized access." };
    }

    // 2. Verify project ownership
    await verifyProjectOwnership(projectId);

    // 3. Find connected repository details
    const linkedRepo = await prisma.gitHubRepository.findUnique({
      where: { projectId },
    });

    if (!linkedRepo) {
      return { success: false, alreadyImported: false, error: "No GitHub repository connected." };
    }

    // 4. Fetch live issue details from GitHub to verify it exists and is not a PR
    const issue = await fetchSingleGitHubIssue(
      user.id,
      linkedRepo.ownerLogin,
      linkedRepo.name,
      issueNumber
    );

    // 5. Duplicate check: verify if it is already imported into this project
    const existing = await prisma.task.findFirst({
      where: {
        projectId,
        githubIssueId: issue.id,
      },
    });

    if (existing) {
      return { success: true, alreadyImported: true, error: null };
    }

    // 6. Calculate position: append at the end of the TODO column
    const lastTodo = await prisma.task.findFirst({
      where: {
        projectId,
        status: "TODO",
      },
      orderBy: { position: "desc" },
    });

    const position = lastTodo ? lastTodo.position + 1000 : 1000;

    // 7. Create Task database row mapping
    await prisma.task.create({
      data: {
        projectId,
        title: issue.title,
        description: `Imported from GitHub Issue #${issue.number}\n\n${issue.body || ""}`,
        status: "TODO",
        priority: "MEDIUM",
        position,
        githubIssueId: issue.id,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.htmlUrl,
        githubIssueTitle: issue.title,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, alreadyImported: false, error: null };
  } catch (error) {
    console.error("Failed to import GitHub issue:", error);
    const errorMsg = error instanceof Error ? error.message : "GitHub issue import failed.";
    return { success: false, alreadyImported: false, error: errorMsg };
  }
}

/**
 * Retrieves paginated Pull Requests from the project's connected repository.
 */
export async function getGitHubPullRequests(
  projectId: string,
  page: number = 1,
  state: "open" | "closed" | "all" = "all"
): Promise<{
  pullRequests: GitHubPullRequestDTO[];
  error: string | null;
}> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return { pullRequests: [], error: "Unauthorized access." };
    }

    // 2. Verify project ownership
    await verifyProjectOwnership(projectId);

    // 3. Find connected repository details
    const linkedRepo = await prisma.gitHubRepository.findUnique({
      where: { projectId },
    });

    if (!linkedRepo) {
      return { pullRequests: [], error: "No GitHub repository connected." };
    }

    // 4. Retrieve paginated pulls list from GitHub API
    const pullRequests = await fetchGitHubPullRequests(
      user.id,
      linkedRepo.ownerLogin,
      linkedRepo.name,
      page,
      state
    );

    return { pullRequests, error: null };
  } catch (error) {
    console.error("Failed to fetch GitHub pull requests:", error);
    const errorMsg = error instanceof Error ? error.message : "Unable to retrieve Pull Requests right now.";
    return { pullRequests: [], error: errorMsg };
  }
}



