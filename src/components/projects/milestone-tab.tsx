"use client";

import * as React from "react";
import { Calendar, Plus, Edit2, Trash2, X, Flag, AlertTriangle } from "lucide-react";
import { createMilestone, updateMilestone, deleteMilestone } from "@/app/actions/work-items";
import { Button } from "@/components/ui/button";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  createdAt: Date;
  _count: {
    tasks: number;
  };
  tasks: {
    status: string;
  }[];
}

interface MilestoneTabProps {
  projectId: string;
  milestones: Milestone[];
}

export function MilestoneTab({ projectId, milestones }: MilestoneTabProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = React.useState<Milestone | null>(null);

  const [createState, createAction, isCreatePending] = React.useActionState(
    async (
      currentState: { error: string | null; success: string | null } | null,
      formData: FormData
    ) => {
      return await createMilestone(projectId, currentState, formData);
    },
    null
  );

  const [editState, editAction, isEditPending] = React.useActionState(
    async (
      currentState: { error: string | null; success: string | null } | null,
      formData: FormData
    ) => {
      if (!editingMilestone) return { error: "No milestone selected", success: null };
      return await updateMilestone(editingMilestone.id, currentState, formData);
    },
    null
  );

  const [isDeletePending, setIsDeletePending] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Auto-close modals on success
  React.useEffect(() => {
    if (createState?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreateOpen(false);
    }
  }, [createState]);

  React.useEffect(() => {
    if (editState?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingMilestone(null);
    }
  }, [editState]);

  const handleDelete = async () => {
    if (!deletingMilestone) return;
    setIsDeletePending(true);
    setDeleteError(null);
    const res = await deleteMilestone(deletingMilestone.id);
    if (res && res.error) {
      setDeleteError(res.error);
      setIsDeletePending(false);
    } else {
      setDeletingMilestone(null);
      setIsDeletePending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Milestones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Define key milestones and roadmap target dates.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-2xl p-16 text-center bg-card/10">
          <Flag className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No milestones yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Break your project into major goals to organize your work and target deadlines.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-6 flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Milestone
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((milestone) => {
            const totalTasks = milestone.tasks.length;
            const completedTasks = milestone.tasks.filter((t) => t.status === "DONE").length;
            const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={milestone.id}
                className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-bold text-base text-foreground leading-tight">{milestone.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingMilestone(milestone)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingMilestone(milestone)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {milestone.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {completedTasks} / {totalTasks} tasks completed ({percent}%)
                    </span>
                    {milestone.dueDate && (
                      <span className="flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded-full">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(milestone.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {totalTasks > 0 && (
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreatePending}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-bold text-foreground mb-1">Add Milestone</h3>
            <p className="text-xs text-muted-foreground mb-5">Create a project target roadmap milestone.</p>

            <form action={createAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Beta Version Launch"
                  disabled={isCreatePending}
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
                  rows={2}
                  placeholder="Goals for this milestone..."
                  disabled={isCreatePending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Due Date (Optional)
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  disabled={isCreatePending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {createState?.error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                  {createState.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreatePending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatePending}>
                  {isCreatePending ? "Saving..." : "Add Milestone"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingMilestone(null)}
              disabled={isEditPending}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-bold text-foreground mb-1">Edit Milestone</h3>
            <p className="text-xs text-muted-foreground mb-5">Update milestone description or deadline.</p>

            <form action={editAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingMilestone.title}
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
                  rows={2}
                  defaultValue={editingMilestone.description || ""}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editingMilestone.dueDate ? new Date(editingMilestone.dueDate).toISOString().split("T")[0] : ""}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  onClick={() => setEditingMilestone(null)}
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
      {deletingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Delete Milestone?</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{deletingMilestone.title}</strong>? 
              Associated tasks will **not** be deleted, but their milestone link will be removed.
            </p>

            {deleteError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingMilestone(null)}
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
