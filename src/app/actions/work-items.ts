"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface ActionState {
  error: string | null;
  success: string | null;
}

// ==========================================
// MILESTONE ACTIONS
// ==========================================

export async function createMilestone(
  projectId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  // 1. Verify user owns the project
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
  });

  if (!project) {
    return { error: "Project not found or access denied.", success: null };
  }

  // 2. Validate input
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }
  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      return { error: "Invalid due date format.", success: null };
    }
  }

  // 3. Create milestone
  try {
    await prisma.milestone.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate,
        projectId,
      },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId,
        action: "CREATE_MILESTONE",
        details: `Created milestone: "${title.trim()}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to create milestone:", error);
    return { error: "An unexpected error occurred.", success: null };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, success: "Milestone created successfully!" };
}

export async function updateMilestone(
  milestoneId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  // 1. Fetch milestone ensuring user owns the associated project
  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      project: { ownerId: user.id },
    },
  });

  if (!milestone) {
    return { error: "Milestone not found or access denied.", success: null };
  }

  // 2. Validate input
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }
  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      return { error: "Invalid due date format.", success: null };
    }
  }

  // 3. Update milestone
  try {
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate,
      },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId: milestone.projectId,
        action: "UPDATE_MILESTONE",
        details: `Updated milestone: "${title.trim()}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to update milestone:", error);
    return { error: "An unexpected error occurred.", success: null };
  }

  revalidatePath(`/projects/${milestone.projectId}`);
  return { error: null, success: "Milestone updated successfully!" };
}

export async function deleteMilestone(milestoneId: string): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  // 1. Fetch milestone and verify ownership via project
  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      project: { ownerId: user.id },
    },
  });

  if (!milestone) {
    return { error: "Milestone not found or access denied." };
  }

  // 2. Delete milestone (Prisma schema will automatically set null on tasks' milestoneId)
  try {
    await prisma.milestone.delete({
      where: { id: milestoneId },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId: milestone.projectId,
        action: "DELETE_MILESTONE",
        details: `Deleted milestone: "${milestone.title}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to delete milestone:", error);
    return { error: "An unexpected database error occurred." };
  }

  revalidatePath(`/projects/${milestone.projectId}`);
  return { error: null };
}

// ==========================================
// TASK ACTIONS
// ==========================================

export async function createTask(
  projectId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  // 1. Verify user owns the project
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
  });

  if (!project) {
    return { error: "Project not found or access denied.", success: null };
  }

  // 2. Validate input
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string || "TODO";
  const priority = formData.get("priority") as string || "MEDIUM";
  const milestoneId = formData.get("milestoneId") as string || null;

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }
  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  // Validate status & priority enums
  if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return { error: "Invalid task status.", success: null };
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return { error: "Invalid task priority.", success: null };
  }

  // Validate cross-project assignment of Milestone
  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId, // Enforces that the milestone belongs to this exact project
      },
    });
    if (!milestone) {
      return { error: "Invalid milestone selection for this project.", success: null };
    }
  }

  // 3. Compute deterministic position
  let newPosition = 1.0;
  try {
    const maxTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
    });
    if (maxTask) {
      newPosition = maxTask.position + 1.0;
    }

    // 4. Create Task
    await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status,
        priority,
        position: newPosition,
        projectId,
        milestoneId: milestoneId || null,
      },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId,
        action: "CREATE_TASK",
        details: `Created task: "${title.trim()}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    return { error: "An unexpected error occurred.", success: null };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, success: "Task created successfully!" };
}

export async function updateTask(
  taskId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  // 1. Fetch task and check project ownership
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { ownerId: user.id },
    },
  });

  if (!task) {
    return { error: "Task not found or access denied.", success: null };
  }

  // 2. Validate input
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string || "TODO";
  const priority = formData.get("priority") as string || "MEDIUM";
  const milestoneId = formData.get("milestoneId") as string || null;

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }
  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  // Validate status & priority enums
  if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return { error: "Invalid task status.", success: null };
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return { error: "Invalid task priority.", success: null };
  }

  // Validate cross-project assignment of Milestone
  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId: task.projectId, // Enforce that the milestone belongs to this task's project
      },
    });
    if (!milestone) {
      return { error: "Invalid milestone selection for this project.", success: null };
    }
  }

  // 3. Update task
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status,
        priority,
        milestoneId: milestoneId || null,
      },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId: task.projectId,
        action: "UPDATE_TASK",
        details: `Updated task: "${title.trim()}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "An unexpected error occurred.", success: null };
  }

  revalidatePath(`/projects/${task.projectId}`);
  return { error: null, success: "Task updated successfully!" };
}

export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  // 1. Fetch task and verify ownership
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { ownerId: user.id },
    },
  });

  if (!task) {
    return { error: "Task not found or access denied." };
  }

  // 2. Delete task
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId: task.projectId,
        action: "DELETE_TASK",
        details: `Deleted task: "${task.title}"`,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { error: "An unexpected database error occurred." };
  }

  revalidatePath(`/projects/${task.projectId}`);
  return { error: null };
}

export async function updateTaskStatus(taskId: string, status: string): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return { error: "Invalid task status." };
  }

  try {
    // Perform ownership-scoped update in a single database operation
    const result = await prisma.task.updateMany({
      where: {
        id: taskId,
        project: { ownerId: user.id },
      },
      data: { status },
    });

    if (result.count === 0) {
      return { error: "Task not found or access denied." };
    }

    // Get the task's project ID for revalidation and activity logging
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });

    if (task) {
      // Log Activity
      await prisma.activityRecord.create({
        data: {
          projectId: task.projectId,
          action: "UPDATE_TASK_STATUS",
          details: `Changed status of "${task.title}" to ${status}`,
          userId: user.id,
        },
      });
      revalidatePath(`/projects/${task.projectId}`);
    }
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { error: "An unexpected error occurred." };
  }

  return { error: null };
}

export async function updateTaskPriority(taskId: string, priority: string): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return { error: "Invalid task priority." };
  }

  try {
    const result = await prisma.task.updateMany({
      where: {
        id: taskId,
        project: { ownerId: user.id },
      },
      data: { priority },
    });

    if (result.count === 0) {
      return { error: "Task not found or access denied." };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });

    if (task) {
      // Log Activity
      await prisma.activityRecord.create({
        data: {
          projectId: task.projectId,
          action: "UPDATE_TASK_PRIORITY",
          details: `Changed priority of "${task.title}" to ${priority}`,
          userId: user.id,
        },
      });
      revalidatePath(`/projects/${task.projectId}`);
    }
  } catch (error) {
    console.error("Failed to update task priority:", error);
    return { error: "An unexpected error occurred." };
  }

  return { error: null };
}

export async function assignTaskToMilestone(
  taskId: string,
  milestoneId: string | null
): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  try {
    // 1. Fetch the task and verify user owns it via project ownership
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { ownerId: user.id },
      },
    });

    if (!task) {
      return { error: "Task not found or access denied." };
    }

    // 2. If assigning to a milestone, verify the milestone exists and belongs to the same project
    if (milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          projectId: task.projectId, // Must be in the exact same project!
        },
      });

      if (!milestone) {
        return { error: "Milestone not found or does not belong to this project." };
      }
    }

    // 3. Perform assignment
    await prisma.task.update({
      where: { id: taskId },
      data: { milestoneId },
    });

    // Log Activity
    await prisma.activityRecord.create({
      data: {
        projectId: task.projectId,
        action: "ASSIGN_TASK_MILESTONE",
        details: milestoneId 
          ? `Assigned task "${task.title}" to milestone.` 
          : `Removed milestone from task "${task.title}".`,
        userId: user.id,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
  } catch (error) {
    console.error("Failed to assign milestone to task:", error);
    return { error: "An unexpected error occurred." };
  }

  return { error: null };
}
