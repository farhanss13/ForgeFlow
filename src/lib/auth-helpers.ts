import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import prisma from "./prisma";

/**
 * Gets the current authenticated user from the validated server-side session.
 * Memoized using React cache to prevent duplicate network calls.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
});

/**
 * Asserts that the current user is authenticated. Throws an error if not.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user;
}

/**
 * Verifies that the current user owns a specific project.
 * Uses explicit ownership filtering for security.
 */
export async function verifyProjectOwnership(projectId: string) {
  const user = await requireUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project || project.ownerId !== user.id) {
    throw new Error("Access Denied: You do not own this project.");
  }
  return true;
}

/**
 * Gets the current profile matching the authenticated user.
 * Memoized using React cache to prevent duplicate database lookups.
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  return await prisma.profile.findUnique({
    where: { id: user.id },
  });
});

/**
 * Asserts the current user has a profile, returning it.
 * Leverages the memoized profile fetcher.
 */
export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Profile not found.");
  }
  return profile;
}
