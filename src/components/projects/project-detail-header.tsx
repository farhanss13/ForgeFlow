"use client";

import * as React from "react";
import Link from "next/link";
import { Edit2, Trash2, X, Calendar, ArrowLeft, AlertTriangle } from "lucide-react";
import { updateProject, deleteProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectDetailHeaderProps {
  project: Project;
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const [editState, editAction, isEditPending] = React.useActionState(
    async (
      currentState: { error: string | null; success: string | null } | null,
      formData: FormData
    ) => {
      return await updateProject(project.id, currentState, formData);
    },
    null
  );

  const [isDeletePending, setIsDeletePending] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Close modal on edit success
  React.useEffect(() => {
    if (editState?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditOpen(false);
    }
  }, [editState]);

  const handleDelete = async () => {
    setIsDeletePending(true);
    setDeleteError(null);
    try {
      const res = await deleteProject(project.id);
      if (res && res.error) {
        setDeleteError(res.error);
        setIsDeletePending(false);
      }
    } catch {
      setDeleteError("An unexpected error occurred.");
      setIsDeletePending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-6 bg-card/30 backdrop-blur-md border border-border/80 rounded-xl shadow-sm">
        <div className="space-y-3 max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {project.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created on{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>
              Updated on{" "}
              {new Date(project.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="flex items-center gap-1">
            <Edit2 className="h-3.5 w-3.5" /> Edit Project
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)} className="flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" /> Delete Project
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditOpen(false)}
              disabled={isEditPending}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-bold text-foreground mb-1">Edit Project Details</h3>
            <p className="text-xs text-muted-foreground mb-5">Update the project name and description.</p>

            <form action={editAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={project.name}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={project.description || ""}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {editState?.error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                  {editState.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditPending}>
                  {isEditPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Delete Project?</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you absolutely sure you want to delete <strong className="text-foreground">{project.name}</strong>? 
              This action cannot be undone and will permanently delete all associated milestones, tasks, documents, and logs.
            </p>

            {deleteError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeletePending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeletePending}
              >
                {isDeletePending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
