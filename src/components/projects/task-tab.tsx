"use client";

import * as React from "react";
import { Plus, X, Search, ChevronDown, Edit2, Trash2, AlertCircle, Tag, CheckSquare, Clock } from "lucide-react";
import { createTask, updateTask, deleteTask, updateTaskStatus, updateTaskPriority, assignTaskToMilestone } from "@/app/actions/work-items";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Milestone {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  milestoneId: string | null;
  milestone: {
    title: string;
  } | null;
}

interface TaskTabProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
}

export function TaskTab({ projectId, tasks, milestones }: TaskTabProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<Task | null>(null);

  // Filters State
  const [search, setSearch] = React.useState("");
  const [selectedMilestone, setSelectedMilestone] = React.useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");

  const [createState, createAction, isCreatePending] = React.useActionState(
    async (
      currentState: { error: string | null; success: string | null } | null,
      formData: FormData
    ) => {
      return await createTask(projectId, currentState, formData);
    },
    null
  );

  const [editState, editAction, isEditPending] = React.useActionState(
    async (
      currentState: { error: string | null; success: string | null } | null,
      formData: FormData
    ) => {
      if (!editingTask) return { error: "No task selected", success: null };
      return await updateTask(editingTask.id, currentState, formData);
    },
    null
  );

  // Auto-close modal on success
  React.useEffect(() => {
    if (createState?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreateOpen(false);
    }
  }, [createState]);

  React.useEffect(() => {
    if (editState?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingTask(null);
    }
  }, [editState]);

  const renderTaskCard = (task: Task) => {
    return (
      <div
        key={task.id}
        className="p-4 bg-card/30 border border-border/60 rounded-xl space-y-3 shadow-sm hover:border-primary/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-sm text-foreground leading-tight">{task.title}</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded transition-colors hover:bg-muted/50 outline-none">
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </div>
              <DropdownMenuItem onClick={() => handleStatusChange(task.id, "TODO")}>To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(task.id, "DONE")}>Done</DropdownMenuItem>
              
              <div className="px-2 py-1.5 border-t border-border/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </div>
              <DropdownMenuItem onClick={() => handlePriorityChange(task.id, "LOW")}>LOW</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange(task.id, "MEDIUM")}>MEDIUM</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange(task.id, "HIGH")}>HIGH</DropdownMenuItem>
              
              <div className="px-2 py-1.5 border-t border-border/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Milestone
              </div>
              <DropdownMenuItem onClick={() => handleMilestoneAssignment(task.id, null)}>Unassign</DropdownMenuItem>
              {milestones.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => handleMilestoneAssignment(task.id, m.id)}>
                  {m.title}
                </DropdownMenuItem>
              ))}

              <div className="border-t border-border/40 mt-1 pt-1">
                <DropdownMenuItem onClick={() => setEditingTask(task)}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeletingTask(task)} className="text-destructive focus:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Task
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className={`text-[10px] font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </Badge>
          {task.milestone && (
            <Badge variant="outline" className="text-[10px] font-medium bg-primary/5 text-primary border-primary/10 flex items-center gap-1 max-w-[150px] truncate">
              <Tag className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{task.milestone.title}</span>
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Handle status update
  const handleStatusChange = async (taskId: string, status: string) => {
    await updateTaskStatus(taskId, status);
  };

  // Handle priority update
  const handlePriorityChange = async (taskId: string, priority: string) => {
    await updateTaskPriority(taskId, priority);
  };

  // Handle milestone assignment
  const handleMilestoneAssignment = async (taskId: string, milestoneId: string | null) => {
    await assignTaskToMilestone(taskId, milestoneId);
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    const res = await deleteTask(deletingTask.id);
    if (!res?.error) {
      setDeletingTask(null);
    }
  };

  // Filter tasks in memory
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchesMilestone = selectedMilestone === "ALL" || 
      (selectedMilestone === "NONE" && !task.milestoneId) || 
      task.milestoneId === selectedMilestone;
    const matchesPriority = selectedPriority === "ALL" || task.priority === selectedPriority;

    return matchesSearch && matchesMilestone && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = filteredTasks.filter((t) => t.status === "DONE");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "LOW":
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "IN_PROGRESS":
        return "bg-primary/10 text-primary border-primary/20";
      case "TODO":
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage details, statuses, and assign milestones.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1 self-start sm:self-center">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 border border-border/40 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Milestone Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative outline-none">
              Milestone: {selectedMilestone === "ALL" ? "All" : selectedMilestone === "NONE" ? "None" : milestones.find(m => m.id === selectedMilestone)?.title}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedMilestone("ALL")}>All Milestones</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedMilestone("NONE")}>Unassigned</DropdownMenuItem>
              {milestones.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => setSelectedMilestone(m.id)}>
                  {m.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative outline-none">
              Priority: {selectedPriority === "ALL" ? "All" : selectedPriority}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPriority("ALL")}>All Priorities</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority("LOW")}>LOW</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority("MEDIUM")}>MEDIUM</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPriority("HIGH")}>HIGH</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task List Grid grouped by Status */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* TODO COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" /> To Do ({todoTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {todoTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No tasks to do.</p>
            ) : (
              todoTasks.map((t) => renderTaskCard(t))
            )}
          </div>
        </div>

        {/* IN_PROGRESS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> In Progress ({inProgressTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No tasks in progress.</p>
            ) : (
              inProgressTasks.map((t) => renderTaskCard(t))
            )}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-green-500" /> Done ({doneTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-4 text-center">No completed tasks.</p>
            ) : (
              doneTasks.map((t) => renderTaskCard(t))
            )}
          </div>
        </div>
      </div>



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

            <h3 className="text-lg font-bold text-foreground mb-1">Add Task</h3>
            <p className="text-xs text-muted-foreground mb-5">Create a task in this project container.</p>

            <form action={createAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Design Landing Page"
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
                  placeholder="Describe task details..."
                  disabled={isCreatePending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    disabled={isCreatePending}
                    className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="MEDIUM"
                    disabled={isCreatePending}
                    className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="milestoneId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assign Milestone (Optional)
                </label>
                <select
                  id="milestoneId"
                  name="milestoneId"
                  disabled={isCreatePending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
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
                  {isCreatePending ? "Creating..." : "Add Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingTask(null)}
              disabled={isEditPending}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-bold text-foreground mb-1">Edit Task</h3>
            <p className="text-xs text-muted-foreground mb-5">Update task title, details or status.</p>

            <form action={editAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingTask.title}
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
                  defaultValue={editingTask.description || ""}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingTask.status}
                    disabled={isEditPending}
                    className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={editingTask.priority}
                    disabled={isEditPending}
                    className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="milestoneId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assign Milestone
                </label>
                <select
                  id="milestoneId"
                  name="milestoneId"
                  defaultValue={editingTask.milestoneId || ""}
                  disabled={isEditPending}
                  className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
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
                  onClick={() => setEditingTask(null)}
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
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Delete Task?</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{deletingTask.title}</strong>? 
              This will permanently delete the task from this project workspace.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
