"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, X, FolderKanban, Calendar, ListTodo, Milestone as MilestoneIcon } from "lucide-react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: {
    tasks: number;
    milestones: number;
  };
}

interface ProjectListProps {
  initialProjects: Project[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [state, formAction, isPending] = React.useActionState(createProject, null);

  // Close modal on success
  React.useEffect(() => {
    if (state?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track your workspaces.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      </div>

      {initialProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-2xl p-16 text-center bg-card/10 backdrop-blur-md">
          <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Your workspace is empty</h2>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Create your first project to start building with ForgeFlow.
          </p>
          <Button onClick={() => setIsOpen(true)} className="mt-6 flex items-center gap-1">
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {initialProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex flex-col justify-between p-6 bg-card/30 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-xl hover:shadow-md transition-all group"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(project.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ListTodo className="h-3.5 w-3.5" />
                    {project._count.tasks}
                  </span>
                  <span className="flex items-center gap-1">
                    <MilestoneIcon className="h-3.5 w-3.5" />
                    {project._count.milestones}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-bold text-foreground mb-1">Create Project</h3>
            <p className="text-xs text-muted-foreground mb-5">Create a new workspace project container.</p>

            <form action={formAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Acme Web App"
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Describe your project goal..."
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {state?.error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                  {state.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
