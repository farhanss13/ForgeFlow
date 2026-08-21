"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser, verifyProjectOwnership } from "@/lib/auth-helpers";
import { 
  fetchGitHubRepositories, 
  verifyRepositoryAccess, 
  fetchGitHubRepositoryDetails,
  type GitHubRepositoryDTO,
  type GitHubRepositoryDetails
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

