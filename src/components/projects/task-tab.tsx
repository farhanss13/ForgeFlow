"use client";

import * as React from "react";
import { Plus, X, Search, ChevronDown, Edit2, Trash2, Tag, CheckSquare, Clock, AlertCircle, Sparkles, Brain, CheckCircle, AlertTriangle, ChevronRight, RefreshCw } from "lucide-react";
import { createTask, updateTask, deleteTask, updateTaskPriority, assignTaskToMilestone, reorderTasks } from "@/app/actions/work-items";
import { generateTaskSuggestions, applyTaskDescription, applyAcceptanceCriteria, addSuggestedSubtasks } from "@/app/actions/assistant-actions";
import { type TaskSuggestion } from "@/lib/ai/client";
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

  // AI Task Assistant State
  const [aiSuggestions, setAiSuggestions] = React.useState<TaskSuggestion | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);

  // Reset AI states when selected task changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAiSuggestions(null);
    setAiError(null);
    setAiSuccess(null);
    setIsAiLoading(false);
  }, [editingTask?.id]);

  const handleAiAnalyze = async () => {
    if (!editingTask || isAiLoading) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    setAiSuggestions(null);

    const res = await generateTaskSuggestions(editingTask.id);
    if (res.error) {
      setAiError(res.error);
    } else if (res.suggestions) {
      setAiSuggestions(res.suggestions);
    }
    setIsAiLoading(false);
  };

  const handleApplyDescription = async () => {
    if (!editingTask || !aiSuggestions || isApplying) return;
    setIsApplying(true);
    setAiError(null);
    setAiSuccess(null);

    const res = await applyTaskDescription(editingTask.id, aiSuggestions.improvedDescription);
    if (res.error) {
      setAiError(res.error);
    } else if (res.success) {
      setAiSuccess("AI task description applied successfully!");
      setEditingTask({ ...editingTask, description: aiSuggestions.improvedDescription });
    }
    setIsApplying(false);
  };

  const handleApplyCriteria = async () => {
    if (!editingTask || !aiSuggestions || isApplying) return;
    setIsApplying(true);
    setAiError(null);
    setAiSuccess(null);

    const res = await applyAcceptanceCriteria(editingTask.id, aiSuggestions.acceptanceCriteria);
    if (res.error) {
      setAiError(res.error);
    } else if (res.success) {
      setAiSuccess("Acceptance criteria appended to task description successfully!");
      
      let checklistMarkdown = "\n\n### Acceptance Criteria\n";
      aiSuggestions.acceptanceCriteria.forEach((item: string) => {
        checklistMarkdown += `- [ ] ${item}\n`;
      });
      const updatedDesc = (editingTask.description || "").trim() + checklistMarkdown;
      setEditingTask({ ...editingTask, description: updatedDesc });
    }
    setIsApplying(false);
  };

  const handleCreateSubtasks = async () => {
    if (!editingTask || !aiSuggestions || isApplying) return;
    setIsApplying(true);
    setAiError(null);
    setAiSuccess(null);

    const res = await addSuggestedSubtasks(editingTask.id, aiSuggestions.subtasks);
    if (res.error) {
      setAiError(res.error);
    } else if (res.success) {
      setAiSuccess(`Created ${aiSuggestions.subtasks.length} subtasks successfully!`);
    }
    setIsApplying(false);
  };

  const handleApplyAll = async () => {
    if (!editingTask || !aiSuggestions || isApplying) return;
    setIsApplying(true);
    setAiError(null);
    setAiSuccess(null);

    const descRes = await applyTaskDescription(editingTask.id, aiSuggestions.improvedDescription);
    if (descRes.error) {
      setAiError(descRes.error);
      setIsApplying(false);
      return;
    }

    const criteriaRes = await applyAcceptanceCriteria(editingTask.id, aiSuggestions.acceptanceCriteria);
    if (criteriaRes.error) {
      setAiError(criteriaRes.error);
      setIsApplying(false);
      return;
    }

    const subRes = await addSuggestedSubtasks(editingTask.id, aiSuggestions.subtasks);
    if (subRes.error) {
      setAiError(subRes.error);
      setIsApplying(false);
      return;
    }

    setAiSuccess("AI Suggestions fully applied successfully!");
    
    let checklistMarkdown = "\n\n### Acceptance Criteria\n";
    aiSuggestions.acceptanceCriteria.forEach((item: string) => {
      checklistMarkdown += `- [ ] ${item}\n`;
    });
    const updatedDesc = aiSuggestions.improvedDescription + checklistMarkdown;
    setEditingTask({ ...editingTask, description: updatedDesc });
    
    setIsApplying(false);
  };

  // Optimistic Tasks State
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync state with server props
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTasks(tasks);
  }, [tasks]);

  // Filters State
  const [search, setSearch] = React.useState("");
  const [selectedMilestone, setSelectedMilestone] = React.useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("ALL");

  // Drag and Drop Local Trackers
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [draggedOverTaskId, setDraggedOverTaskId] = React.useState<string | null>(null);
  const [isDraggingOverColumn, setIsDraggingOverColumn] = React.useState<string | null>(null);

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

  // Helper to handle status update
  const handleStatusChange = async (taskId: string, status: string) => {
    setErrorMsg(null);
    const taskToMove = localTasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    // Fetch new order within destination column
    const destTasks = localTasks.filter((t) => t.status === status && t.id !== taskId);
    const orderedDestTaskIds = [...destTasks.map((t) => t.id), taskId];
    const sourceTasks = localTasks.filter((t) => t.status === taskToMove.status && t.id !== taskId);
    const orderedSourceTaskIds = sourceTasks.map((t) => t.id);

    // Save previous state for rollback
    const prevTasks = [...localTasks];

    // Optimistically update status
    setLocalTasks(
      localTasks.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    const res = await reorderTasks(taskId, status, orderedDestTaskIds, orderedSourceTaskIds);
    if (res && res.error) {
      setErrorMsg(res.error);
      setLocalTasks(prevTasks);
    }
  };

  // Helper to handle priority update
  const handlePriorityChange = async (taskId: string, priority: string) => {
    setErrorMsg(null);
    const res = await updateTaskPriority(taskId, priority);
    if (res && res.error) {
      setErrorMsg(res.error);
    }
  };

  // Helper to handle milestone assignment
  const handleMilestoneAssignment = async (taskId: string, milestoneId: string | null) => {
    setErrorMsg(null);
    const res = await assignTaskToMilestone(taskId, milestoneId);
    if (res && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setErrorMsg(null);
    const res = await deleteTask(deletingTask.id);
    if (res && res.error) {
      setErrorMsg(res.error);
    } else {
      setDeletingTask(null);
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverColumn = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setIsDraggingOverColumn(columnStatus);
  };

  const handleDragOverCard = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardId !== draggedTaskId) {
      setDraggedOverTaskId(cardId);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedOverTaskId(null);
    setIsDraggingOverColumn(null);
  };

  const handleDropColumn = async (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const taskToMove = localTasks.find((t) => t.id === draggedTaskId);
    if (!taskToMove) return;

    const sourceStatus = taskToMove.status;
    const isSameCol = sourceStatus === columnStatus;

    // Filter list inside columns
    const sourceTasks = localTasks.filter((t) => t.status === sourceStatus && t.id !== draggedTaskId);
    const destTasks = localTasks.filter((t) => t.status === columnStatus && t.id !== draggedTaskId);

    let orderedDestIds: string[] = [];
    const orderedSourceIds: string[] = sourceTasks.map((t) => t.id);

    // If dropped on a specific card, insert it there. Otherwise, append to the end.
    if (draggedOverTaskId) {
      const insertIndex = destTasks.findIndex((t) => t.id === draggedOverTaskId);
      const updatedDest = [...destTasks];
      updatedDest.splice(insertIndex, 0, taskToMove);
      orderedDestIds = updatedDest.map((t) => t.id);
    } else {
      orderedDestIds = [...destTasks.map((t) => t.id), draggedTaskId];
    }

    // Save previous state for rollback
    const prevTasks = [...localTasks];

    // Optimistic Update
    const updatedTasks = localTasks.map((t) => {
      if (t.id === draggedTaskId) {
        return { ...t, status: columnStatus };
      }
      return t;
    });
    setLocalTasks(updatedTasks);

    setErrorMsg(null);
    const res = await reorderTasks(draggedTaskId, columnStatus, orderedDestIds, isSameCol ? undefined : orderedSourceIds);
    if (res && res.error) {
      setErrorMsg(res.error);
      setLocalTasks(prevTasks);
    }

    handleDragEnd();
  };

  // Filter local tasks in memory for search & headers
  const filteredTasks = localTasks.filter((task) => {
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

  const renderTaskCard = (task: Task) => {
    const isDragged = task.id === draggedTaskId;
    const isOver = task.id === draggedOverTaskId;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOverCard(e, task.id)}
        className={`p-4 bg-card/30 border border-border/60 rounded-xl space-y-3 shadow-sm hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing ${
          isDragged ? "opacity-40 border-dashed border-primary" : ""
        } ${isOver ? "border-primary/80 ring-2 ring-primary/20 scale-[1.01]" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-sm text-foreground leading-tight">{task.title}</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded transition-colors hover:bg-muted/50 outline-none">
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status (Accessible Move)
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

  return (
    <div className="space-y-6">
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kanban Board</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Drag tasks across columns or within a list to reorder.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1 self-start sm:self-center">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

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
      <div className="grid gap-6 md:grid-cols-3 overflow-x-auto pb-4">
        {/* TODO COLUMN */}
        <div
          onDragOver={(e) => handleDragOverColumn(e, "TODO")}
          onDrop={(e) => handleDropColumn(e, "TODO")}
          className={`space-y-4 p-4 rounded-xl border border-dashed transition-colors min-h-[400px] ${
            isDraggingOverColumn === "TODO" ? "bg-primary/5 border-primary/50" : "border-border/40 bg-muted/10"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" /> To Do ({todoTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {todoTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-8 text-center select-none">No tasks here yet.</p>
            ) : (
              todoTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* IN_PROGRESS COLUMN */}
        <div
          onDragOver={(e) => handleDragOverColumn(e, "IN_PROGRESS")}
          onDrop={(e) => handleDropColumn(e, "IN_PROGRESS")}
          className={`space-y-4 p-4 rounded-xl border border-dashed transition-colors min-h-[400px] ${
            isDraggingOverColumn === "IN_PROGRESS" ? "bg-primary/5 border-primary/50" : "border-border/40 bg-muted/10"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> In Progress ({inProgressTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-8 text-center select-none">No tasks here yet.</p>
            ) : (
              inProgressTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div
          onDragOver={(e) => handleDragOverColumn(e, "DONE")}
          onDrop={(e) => handleDropColumn(e, "DONE")}
          className={`space-y-4 p-4 rounded-xl border border-dashed transition-colors min-h-[400px] ${
            isDraggingOverColumn === "DONE" ? "bg-primary/5 border-primary/50" : "border-border/40 bg-muted/10"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-green-500" /> Done ({doneTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-8 text-center select-none">No tasks here yet.</p>
            ) : (
              doneTasks.map(renderTaskCard)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-4xl p-6 rounded-xl border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
              onClick={() => setEditingTask(null)}
              disabled={isEditPending}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Form Edit Fields */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Edit Task</h3>
                  <p className="text-xs text-muted-foreground">Update task title, details or status.</p>
                </div>

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
                      rows={4}
                      key={editingTask.id + "-" + (editingTask.description || "")}
                      defaultValue={editingTask.description || ""}
                      disabled={isEditPending}
                      className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
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

              {/* Right Column: AI Task Assistant */}
              <div className="border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0 md:pl-8 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" /> AI Task Assistant
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Get suggestions for task enhancements, subtasks, criteria and edge cases.
                  </p>
                </div>

                {/* AI Loading State */}
                {isAiLoading && (
                  <div className="p-8 border border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center text-center gap-3">
                    <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-xs font-medium text-foreground">Analyzing task details...</p>
                    <p className="text-[10px] text-muted-foreground/60">Fetching structured advice from Gemini 3.6 Flash</p>
                  </div>
                )}

                {/* AI Error Log */}
                {aiError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* AI Success Banner */}
                {aiSuccess && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl font-medium flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{aiSuccess}</span>
                  </div>
                )}

                {/* Empty State before generation */}
                {!aiSuggestions && !isAiLoading && (
                  <div className="p-6 border border-dashed border-border/60 rounded-xl bg-card/20 flex flex-col items-center justify-center text-center gap-4">
                    <Brain className="h-8 w-8 text-muted-foreground/60" />
                    <div className="space-y-1 max-w-[240px]">
                      <p className="text-xs font-semibold text-foreground">Need context enhancement?</p>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                        Submit this task description to Gemini to break down subtasks and identify technical constraints.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleAiAnalyze}
                      className="text-xs h-8 gap-1.5 cursor-pointer font-medium"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Enhance Task with AI
                    </Button>
                  </div>
                )}

                {/* Suggestions display preview panel */}
                {aiSuggestions && !isAiLoading && (
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                    {/* Header CTAs */}
                    <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-lg border border-border/30">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        AI Suggestions
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setAiSuggestions(null)} 
                          className="h-7 text-[10px] cursor-pointer"
                        >
                          Discard
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          disabled={isApplying}
                          onClick={handleApplyAll} 
                          className="h-7 text-[10px] gap-1 cursor-pointer font-semibold"
                        >
                          {isApplying ? "Applying..." : "Apply All"}
                        </Button>
                      </div>
                    </div>

                    {/* Refined Description suggestion */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Improved Description
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          disabled={isApplying}
                          onClick={handleApplyDescription}
                          className="h-6 text-[9px] px-2 cursor-pointer"
                        >
                          Apply Description
                        </Button>
                      </div>
                      <div className="p-3 bg-background/50 border border-border/40 rounded-lg text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono">
                        {aiSuggestions.improvedDescription}
                      </div>
                    </div>

                    {/* Acceptance Criteria suggestion */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Acceptance Criteria
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          disabled={isApplying}
                          onClick={handleApplyCriteria}
                          className="h-6 text-[9px] px-2 cursor-pointer"
                        >
                          Append Criteria
                        </Button>
                      </div>
                      <ul className="space-y-1.5 pl-1.5">
                        {aiSuggestions.acceptanceCriteria.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">☐</span>
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subtasks suggestions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Suggested Subtasks
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          disabled={isApplying}
                          onClick={handleCreateSubtasks}
                          className="h-6 text-[9px] px-2 cursor-pointer"
                        >
                          Create Subtasks
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {aiSuggestions.subtasks.map((sub: { title: string; description: string | null }, idx: number) => (
                          <div key={idx} className="p-2 bg-background/40 border border-border/30 rounded-lg space-y-0.5">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                              <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                              {sub.title}
                            </p>
                            {sub.description && (
                              <p className="text-[10px] text-muted-foreground/80 pl-4.5">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Considerations suggestions */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Technical Considerations
                      </span>
                      <ul className="space-y-1.5 pl-1.5">
                        {aiSuggestions.technicalConsiderations.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">→</span>
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Edge Cases suggestions */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Edge Cases
                      </span>
                      <ul className="space-y-1.5 pl-1.5">
                        {aiSuggestions.edgeCases.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-destructive mt-0.5">⚠</span>
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
