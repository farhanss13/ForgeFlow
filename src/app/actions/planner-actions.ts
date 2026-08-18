"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireProfile, verifyProjectOwnership } from "@/lib/auth-helpers";
import { generateProjectPlan, GeneratedPlan } from "@/lib/ai/client";

/**
 * Invokes Gemini API server-side to generate a structured project plan proposal.
 * Does NOT persist any data to the database.
 */
export async function generatePlan(
  projectId: string,
  requirements: string
): Promise<{ error: string | null; plan: GeneratedPlan | null }> {
  try {
    // 1. Authorization
    await requireProfile();
    await verifyProjectOwnership(projectId);

    // 2. Requirements Validation
    if (!requirements || requirements.trim().length < 10) {
      return { error: "Please provide a more detailed project description (minimum 10 characters).", plan: null };
    }
    if (requirements.length > 2000) {
      return { error: "Requirements description cannot exceed 2000 characters.", plan: null };
    }

    // 3. AI Generation
    const plan = await generateProjectPlan(requirements.trim());
    return { error: null, plan };
  } catch (error) {
    console.error("AI Planner generation failed:", error);
    const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred during plan generation.";
    return { 
      error: errorMsg, 
      plan: null 
    };
  }
}

/**
 * Persists the approved AI-generated project plan atomically inside a Prisma transaction.
 */
export async function persistPlan(
  projectId: string,
  plan: GeneratedPlan
): Promise<{ error: string | null; success: boolean }> {
  let profile;
  try {
    // 1. Authorization
    profile = await requireProfile();
    await verifyProjectOwnership(projectId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unauthorized access.";
    return { error: errorMsg, success: false };
  }

  // 2. Validate submitted plan format again
  if (!plan || !Array.isArray(plan.milestones) || plan.milestones.length === 0) {
    return { error: "The provided plan is invalid or empty.", success: false };
  }

  try {
    // 3. Run atomic transaction
    await prisma.$transaction(async (tx) => {
      // Find current max task position in the project to make sure position indexes remain unique
      const maxTask = await tx.task.findFirst({
        where: { projectId },
        orderBy: { position: "desc" },
        select: { position: true }
      });
      let basePosition = maxTask ? maxTask.position + 1.0 : 1.0;

      for (const milestone of plan.milestones) {
        // Create milestone
        const createdMilestone = await tx.milestone.create({
          data: {
            projectId,
            title: milestone.title.trim(),
            description: milestone.description ? milestone.description.trim() : null,
          }
        });

        // Create tasks associated with this milestone
        if (Array.isArray(milestone.tasks)) {
          for (const task of milestone.tasks) {
            await tx.task.create({
              data: {
                projectId,
                milestoneId: createdMilestone.id,
                title: task.title.trim(),
                description: task.description ? task.description.trim() : null,
                status: "TODO",
                priority: task.priority,
                position: basePosition
              }
            });
            basePosition += 1.0;
          }
        }
      }

      // Log Activity Record
      await tx.activityRecord.create({
        data: {
          projectId,
          action: "AI_PLAN_APPLIED",
          details: `Generated and applied plan with ${plan.milestones.length} milestones.`,
          userId: profile.id
        }
      });
    });

    revalidatePath(`/projects/${projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to persist AI plan:", error);
    return { error: "Failed to save the project plan. Transaction rolled back.", success: false };
  }
}
