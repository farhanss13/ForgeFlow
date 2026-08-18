"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireProfile, verifyProjectOwnership } from "@/lib/auth-helpers";

export interface ActionState {
  error: string | null;
  success: string | null;
}

export async function createDocument(
  projectId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let profile;
  try {
    profile = await requireProfile();
    await verifyProjectOwnership(projectId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unauthorized access.";
    return { error: errorMsg, success: null };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string || "";

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }

  try {
    const document = await prisma.document.create({
      data: {
        projectId,
        title: title.trim(),
        content: content.trim(),
      },
    });

    // Log activity
    await prisma.activityRecord.create({
      data: {
        projectId,
        action: "CREATE_DOCUMENT",
        details: `Created document: "${title.trim()}"`,
        userId: profile.id,
      },
    });

    revalidatePath(`/projects/${projectId}/documents`);
    return { error: null, success: document.id };
  } catch (error) {
    console.error("Failed to create document:", error);
    return { error: "An unexpected error occurred.", success: null };
  }
}

export async function updateDocument(
  documentId: string,
  currentState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return { error: "Authentication required.", success: null };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string || "";

  if (!title || title.trim().length === 0) {
    return { error: "Title is required.", success: null };
  }
  if (title.length > 100) {
    return { error: "Title cannot exceed 100 characters.", success: null };
  }

  try {
    // Verify document belongs to project owned by the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        project: { ownerId: profile.id },
      },
    });

    if (!document) {
      return { error: "Document not found or access denied.", success: null };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        title: title.trim(),
        content: content.trim(),
      },
    });

    // Log activity
    await prisma.activityRecord.create({
      data: {
        projectId: document.projectId,
        action: "UPDATE_DOCUMENT",
        details: `Updated document: "${title.trim()}"`,
        userId: profile.id,
      },
    });

    revalidatePath(`/projects/${document.projectId}/documents`);
    return { error: null, success: "Document updated successfully!" };
  } catch (error) {
    console.error("Failed to update document:", error);
    return { error: "An unexpected error occurred.", success: null };
  }
}

export async function deleteDocument(documentId: string): Promise<{ error: string | null }> {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return { error: "Authentication required." };
  }

  try {
    // Verify document belongs to project owned by user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        project: { ownerId: profile.id },
      },
    });

    if (!document) {
      return { error: "Document not found or access denied." };
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    // Log activity
    await prisma.activityRecord.create({
      data: {
        projectId: document.projectId,
        action: "DELETE_DOCUMENT",
        details: `Deleted document: "${document.title}"`,
        userId: profile.id,
      },
    });

    revalidatePath(`/projects/${document.projectId}/documents`);
    return { error: null };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { error: "An unexpected error occurred." };
  }
}
