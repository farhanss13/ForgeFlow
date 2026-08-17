import { notFound } from "next/navigation";
import { FolderKanban, ListTodo, Milestone as MilestoneIcon } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { projectId } = await params;

  // Query only using project ID AND ownerId to enforce security server-side.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: profile.id,
    },
    include: {
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });

  // Treat missing or unauthorized projects as "Not Found" to avoid leaking their existence.
  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <ProjectDetailHeader project={project} />

      {/* Project Metrics Summary (Workspace Foundation) */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Tasks Summary */}
        <div className="p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{project._count.tasks} Total Tasks</p>
            <p className="text-xs text-muted-foreground mt-0.5">Manage tasks in the upcoming Phase 5.</p>
          </div>
        </div>

        {/* Milestones Summary */}
        <div className="p-6 bg-card/40 backdrop-blur-md border border-border rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <MilestoneIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestones</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{project._count.milestones} Milestones</p>
            <p className="text-xs text-muted-foreground mt-0.5">Manage goals and milestone roadmaps.</p>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="p-6 bg-muted/20 border border-border/50 rounded-xl space-y-2">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" /> Workspace Foundation Activated
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This project page represents the workspace shell. Real-time boards, milestones roadmap, task managers, and integrations will be implemented in subsequent phases.
        </p>
      </div>
    </div>
  );
}
