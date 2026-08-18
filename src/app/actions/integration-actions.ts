"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";

/**
 * Disconnects the user's GitHub integration by removing their record from the database.
 */
export async function disconnectGithub(): Promise<{ error: string | null; success: boolean }> {
  try {
    // 1. Authenticate user profile server-side
    const profile = await requireProfile();

    // 2. Perform deletion
    const connection = await prisma.gitHubConnection.findUnique({
      where: { userId: profile.id }
    });

    if (!connection) {
      throw new Error("No connected GitHub account found.");
    }

    await prisma.gitHubConnection.delete({
      where: { userId: profile.id }
    });

    revalidatePath("/settings");
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to disconnect GitHub account:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to disconnect account. Please try again.";
    return { 
      error: errorMsg, 
      success: false 
    };
  }
}
