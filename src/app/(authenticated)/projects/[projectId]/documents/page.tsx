import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";
import { DocumentsWorkspace } from "@/components/projects/documents-workspace";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDocumentsPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { projectId } = await params;

  // Single query to check authorization and load all document items
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: profile.id,
    },
    include: {
      documents: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="py-2">
      <DocumentsWorkspace
        projectId={project.id}
        projectName={project.name}
        documents={project.documents}
      />
    </div>
  );
}
