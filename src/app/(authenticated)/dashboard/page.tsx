import Link from "next/link";
import { FolderKanban, ListChecks, CheckCircle2, Plus, Calendar, ArrowRight, Activity } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const profile = await requireProfile();

  // 1. Fetch user-scoped counts
  const totalProjects = await prisma.project.count({
    where: { ownerId: profile.id },
  });

  const totalTasks = await prisma.task.count({
    where: {
      project: {
        ownerId: profile.id,
      },
    },
  });

  const completedTasks = await prisma.task.count({
    where: {
      project: {
        ownerId: profile.id,
      },
      status: "DONE",
    },
  });

  // 2. Fetch user-scoped recent projects
  const recentProjects = await prisma.project.findMany({
    where: { ownerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });

  // 3. Fetch user-scoped recent activity records
  const recentActivities = await prisma.activityRecord.findMany({
    where: {
      project: {
        ownerId: profile.id,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  const displayName = profile.fullName || profile.email;

  return (
    <div className="space-y-8">
      {/* Welcome Heading */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is an overview of your active workspace projects and items.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Projects Card */}
        <div className="p-6 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{totalProjects}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <FolderKanban className="h-6 w-6" />
          </div>
        </div>

        {/* Total Tasks Card */}
        <div className="p-6 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{totalTasks}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ListChecks className="h-6 w-6" />
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="p-6 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {completedTasks} <span className="text-sm font-normal text-muted-foreground">/ {totalTasks}</span>
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects List */}
        <div className="p-6 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-foreground">Recent Projects</h3>
              <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <FolderKanban className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your workspace is empty.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Create your first project to start building.</p>
                </div>
                <Link href="/projects" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {project._count.tasks} tasks • {project._count.milestones} milestones
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="p-6 bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm flex flex-col min-h-[300px]">
          <h3 className="font-semibold text-lg text-foreground mb-4">Recent Activity</h3>

          {recentActivities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
              <Activity className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="text-sm font-medium text-foreground">No recent activity.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Actions you take on projects will show here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[250px] pr-2">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <p className="text-foreground text-xs">
                      <span className="font-semibold">{act.action}</span> in{" "}
                      <span className="font-medium text-primary">{act.project.name}</span>
                    </p>
                    <p className="text-muted-foreground text-[11px]">{act.details}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(act.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
