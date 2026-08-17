import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";
import { ProjectList } from "@/components/projects/project-list";

export default async function ProjectsPage() {
  const profile = await requireProfile();

  // Fetch only projects owned by the currently authenticated user
  const projects = await prisma.project.findMany({
    where: {
      ownerId: profile.id,
    },
    orderBy: {
      createdAt: "desc",
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

  return <ProjectList initialProjects={projects} />;
}
