"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireProfile, verifyProjectOwnership } from "@/lib/auth-helpers";
import { getTaskSuggestions, TaskSuggestion } from "@/lib/ai/client";

/**
 * Generates AI task improvement suggestions using the server-side Gemini client.
 */
export async function generateTaskSuggestions(
  taskId: string
): Promise<{ error: string | null; suggestions: TaskSuggestion | null }> {
  try {
    // 1. Authenticate user
    await requireProfile();

    // 2. Fetch task and check project ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        milestone: true,
      },
    });

    if (!task) {
      return { error: "Task not found.", suggestions: null };
    }

    // Verify ownership
    await verifyProjectOwnership(task.projectId);

    // 3. Request suggestions from AI
    const suggestions = await getTaskSuggestions({
      taskTitle: task.title,
      taskDescription: task.description,
      projectName: task.project.name,
      projectDescription: task.project.description,
      milestoneTitle: task.milestone?.title,
    });

    return { error: null, suggestions };
  } catch (error) {
    console.error("Failed to generate task suggestions:", error);
    const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred while generating suggestions.";
    return {
      error: errorMsg,
      suggestions: null,
    };
  }
}

/**
 * Updates the description of a task with the AI-suggested description.
 */
export async function applyTaskDescription(
  taskId: string,
  newDescription: string
): Promise<{ error: string | null; success: boolean }> {
  try {
    const profile = await requireProfile();
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { error: "Task not found.", success: false };
    }

    // Verify ownership
    await verifyProjectOwnership(task.projectId);

    // Update database
    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { description: newDescription.trim() },
      });

      await tx.activityRecord.create({
        data: {
          projectId: task.projectId,
          action: "UPDATE_TASK_DESCRIPTION",
          details: `Enhanced description for task: "${task.title}" using AI.`,
          userId: profile.id,
        },
      });
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to apply task description:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to update description.";
    return { error: errorMsg, success: false };
  }
}

/**
 * Appends AI-generated acceptance criteria formatted as markdown checkboxes to the task description.
 */
export async function applyAcceptanceCriteria(
  taskId: string,
  criteria: string[]
): Promise<{ error: string | null; success: boolean }> {
  try {
    const profile = await requireProfile();
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { error: "Task not found.", success: false };
    }

    // Verify ownership
    await verifyProjectOwnership(task.projectId);

    if (!criteria || criteria.length === 0) {
      return { error: "No criteria selected.", success: false };
    }

    // Construct markdown checklist
    let checklistMarkdown = "\n\n### Acceptance Criteria\n";
    criteria.forEach((item) => {
      checklistMarkdown += `- [ ] ${item}\n`;
    });

    const updatedDescription = (task.description || "").trim() + checklistMarkdown;

    // Save in transaction
    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { description: updatedDescription },
      });

      await tx.activityRecord.create({
        data: {
          projectId: task.projectId,
          action: "APPLY_TASK_CRITERIA",
          details: `Applied ${criteria.length} acceptance criteria items to task: "${task.title}".`,
          userId: profile.id,
        },
      });
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to apply acceptance criteria:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to save criteria.";
    return { error: errorMsg, success: false };
  }
}

/**
 * Persists AI-suggested subtasks as standard tasks belonging to the project and milestone.
 */
export async function addSuggestedSubtasks(
  taskId: string,
  subtasks: { title: string; description: string | null }[]
): Promise<{ error: string | null; success: boolean }> {
  try {
    const profile = await requireProfile();
    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!parentTask) {
      return { error: "Task not found.", success: false };
    }

    // Verify ownership
    await verifyProjectOwnership(parentTask.projectId);

    if (!subtasks || subtasks.length === 0) {
      return { error: "No subtasks to add.", success: false };
    }

    // Persist atomically in transaction
    await prisma.$transaction(async (tx) => {
      // Find the maximum position index in this project to order subtasks correctly
      const maxTask = await tx.task.findFirst({
        where: { projectId: parentTask.projectId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      let basePosition = maxTask ? maxTask.position + 1.0 : 1.0;

      for (const sub of subtasks) {
        await tx.task.create({
          data: {
            projectId: parentTask.projectId,
            milestoneId: parentTask.milestoneId,
            // Prefix title to logically associate it with the parent task in list view
            title: `[Subtask] ${sub.title.trim()}`,
            description: sub.description ? sub.description.trim() : `Subtask of: ${parentTask.title}`,
            status: "TODO",
            priority: parentTask.priority,
            position: basePosition,
          },
        });
        basePosition += 1.0;
      }

      await tx.activityRecord.create({
        data: {
          projectId: parentTask.projectId,
          action: "CREATE_TASK_SUBTASKS",
          details: `Created ${subtasks.length} subtasks under parent task: "${parentTask.title}".`,
          userId: profile.id,
        },
      });
    });

    revalidatePath(`/projects/${parentTask.projectId}`);
    return { error: null, success: true };
  } catch (error) {
    console.error("Failed to add subtasks:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to create subtasks.";
    return { error: errorMsg, success: false };
  }
}
