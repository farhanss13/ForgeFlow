import { notFound } from "next/navigation";
import Link from "next/link";
import { ListTodo, Milestone as MilestoneIcon, Layers, CheckSquare } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { MilestoneTab } from "@/components/projects/milestone-tab";
import { TaskTab } from "@/components/projects/task-tab";

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const profile = await requireProfile();
  const { projectId } = await params;
  const { tab = "overview" } = await searchParams;

  // Single optimized query to fetch project, milestones, and tasks to avoid N+1 queries.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: profile.id,
    },
    include: {
      milestones: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
          tasks: {
            select: {
              status: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { position: "asc" },
        include: {
          milestone: {
            select: {
              title: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });

  // Treat missing/unauthorized projects as "Not Found" for security.
  if (!project) {
    notFound();
  }

  // Calculate task statistics in memory
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-8">
      <ProjectDetailHeader project={project} />

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 -mb-px" aria-label="Tabs">
          <Link
            href={`/projects/${projectId}?tab=overview`}
            replace
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
              tab === "overview"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </Link>
          <Link
            href={`/projects/${projectId}?tab=milestones`}
            replace
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
              tab === "milestones"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Milestones ({project._count.milestones})
          </Link>
          <Link
            href={`/projects/${projectId}?tab=tasks`}
            replace
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
              tab === "tasks"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tasks ({project._count.tasks})
          </Link>
          <Link
            href={`/projects/${projectId}/documents`}
            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            Wiki / Docs
          </Link>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Total Tasks */}
              <div className="p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <ListTodo className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{totalTasks}</p>
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Tasks</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {completedTasks} / {totalTasks}
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div className="p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <MilestoneIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestones</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{project._count.milestones}</p>
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className="p-6 bg-muted/20 border border-border/50 rounded-xl space-y-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Project Workspace Active
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Welcome to your project workspace. Use the tabs above to manage project goals (Milestones) and track lists of requirements (Tasks). Deleting milestones will safely detach tasks, keeping your progress reports intact.
              </p>
            </div>
          </div>
        )}

        {tab === "milestones" && (
          <MilestoneTab projectId={projectId} milestones={project.milestones} />
        )}

        {tab === "tasks" && (
          <TaskTab 
            projectId={projectId} 
            tasks={project.tasks} 
            milestones={project.milestones.map(m => ({ id: m.id, title: m.title }))} 
          />
        )}
      </div>
    </div>
  );
}
