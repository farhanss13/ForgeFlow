"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ProjectState {
  error: string | null;
  success: string | null;
}

export async function createProject(currentState: ProjectState | null, formData: FormData): Promise<ProjectState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Project name is required.", success: null };
  }

  if (name.length > 100) {
    return { error: "Project name cannot exceed 100 characters.", success: null };
  }

  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  try {
    await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        ownerId: user.id,
      },
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "An unexpected error occurred while creating the project.", success: null };
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  
  return { error: null, success: "Project created successfully!" };
}

export async function updateProject(
  projectId: string,
  currentState: ProjectState | null,
  formData: FormData
): Promise<ProjectState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Project name is required.", success: null };
  }

  if (name.length > 100) {
    return { error: "Project name cannot exceed 100 characters.", success: null };
  }

  if (description && description.length > 500) {
    return { error: "Description cannot exceed 500 characters.", success: null };
  }

  try {
    // Verify ownership and update in a single atomic transaction/query
    const result = await prisma.project.updateMany({
      where: {
        id: projectId,
        ownerId: user.id,
      },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    if (result.count === 0) {
      return { error: "Project not found or access denied.", success: null };
    }
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "An unexpected error occurred while updating the project.", success: null };
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return { error: null, success: "Project updated successfully!" };
}

export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Authentication required." };
  }

  try {
    // Verify ownership and delete
    const result = await prisma.project.deleteMany({
      where: {
        id: projectId,
        ownerId: user.id,
      },
    });

    if (result.count === 0) {
      return { error: "Project not found or access denied." };
    }
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "An unexpected error occurred while deleting the project." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect("/projects");
}
