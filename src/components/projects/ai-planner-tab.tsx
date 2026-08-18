"use client";

import * as React from "react";
import { Sparkles, Brain, CheckSquare, RefreshCw, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { generatePlan, persistPlan } from "@/app/actions/planner-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GeneratedTask {
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface GeneratedMilestone {
  title: string;
  description: string | null;
  tasks: GeneratedTask[];
}

interface GeneratedPlan {
  milestones: GeneratedMilestone[];
}

interface AiPlannerTabProps {
  projectId: string;
}

export function AiPlannerTab({ projectId }: AiPlannerTabProps) {
  const [requirements, setRequirements] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isPersisting, setIsPersisting] = React.useState(false);
  const [proposedPlan, setProposedPlan] = React.useState<GeneratedPlan | null>(null);
  
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requirements.trim().length < 10 || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProposedPlan(null);

    const res = await generatePlan(projectId, requirements);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.plan) {
      setProposedPlan(res.plan);
    }
    setIsGenerating(false);
  };

  const handleAccept = async () => {
    if (!proposedPlan || isPersisting) return;

    setIsPersisting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await persistPlan(projectId, proposedPlan);
    if (res.error) {
      setErrorMsg(res.error);
      setIsPersisting(false);
    } else if (res.success) {
      setSuccessMsg("AI generated plan successfully applied to your project workspace!");
      setProposedPlan(null);
      setRequirements("");
      setIsPersisting(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary animate-pulse" /> AI Project Planner
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Describe your application requirements to automatically generate structured milestones and task items.
        </p>
      </div>

      {/* Alert logs */}
      {errorMsg && (
        <div className="p-4 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-medium flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 text-xs bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl font-medium flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Requirements Input Form */}
      {!proposedPlan && (
        <form onSubmit={handleGenerate} className="p-6 bg-card/30 border border-border/60 rounded-2xl space-y-4 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="requirements" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What are your project goals and requirements?
            </label>
            <textarea
              id="requirements"
              rows={5}
              placeholder="e.g. I want to build a user authentication system with email login, signup, password reset, and a settings page to update full names..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={isGenerating}
              className="w-full p-4 bg-background/30 border border-input rounded-xl text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[140px]"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-md">
              Gemini will translate your requirements into target milestones containing actionable priority tasks.
            </p>
            <Button
              type="submit"
              disabled={requirements.trim().length < 10 || isGenerating}
              className="flex items-center gap-1.5 cursor-pointer font-medium"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Project Plan
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Review Proposed Plan Container */}
      {proposedPlan && (
        <div className="space-y-6">
          <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Proposed Project Plan
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review the milestones and tasks generated by the model. Click Accept to create these items in your workspace.
              </p>
            </div>
            <div className="flex items-center gap-3.5 shrink-0">
              <Button
                variant="outline"
                disabled={isPersisting}
                onClick={() => setProposedPlan(null)}
                className="text-xs h-8 px-3 cursor-pointer"
              >
                Regenerate / Edit
              </Button>
              <Button
                disabled={isPersisting}
                onClick={handleAccept}
                className="text-xs h-8 px-3 flex items-center gap-1 cursor-pointer"
              >
                {isPersisting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Accept Plan
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Proposed Milestones list details */}
          <div className="space-y-6">
            {proposedPlan.milestones.map((milestone, mIndex) => (
              <div 
                key={mIndex} 
                className="p-6 bg-card/10 border border-border/50 rounded-2xl space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Milestone {mIndex + 1}
                  </span>
                  <h4 className="font-bold text-base text-foreground leading-tight">
                    {milestone.title}
                  </h4>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {milestone.description}
                    </p>
                  )}
                </div>

                {/* Proposed Tasks details list */}
                <div className="border-t border-border/30 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Proposed Tasks ({milestone.tasks.length})
                  </span>
                  {milestone.tasks.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground/60">No tasks proposed for this milestone.</p>
                  ) : (
                    milestone.tasks.map((task, tIndex) => (
                      <div 
                        key={tIndex} 
                        className="p-3 bg-background/40 border border-border/40 rounded-xl flex items-start justify-between gap-4 text-left"
                      >
                        <div className="space-y-1">
                          <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                            {task.title}
                          </h5>
                          {task.description && (
                            <p className="text-[11px] text-muted-foreground/80 leading-relaxed pl-5">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[9px] font-semibold shrink-0 uppercase ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3.5 pt-4">
            <Button
              variant="outline"
              disabled={isPersisting}
              onClick={() => setProposedPlan(null)}
              className="cursor-pointer"
            >
              Discard and Go Back
            </Button>
            <Button
              disabled={isPersisting}
              onClick={handleAccept}
              className="flex items-center gap-1 cursor-pointer"
            >
              {isPersisting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" /> Accept Plan
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
