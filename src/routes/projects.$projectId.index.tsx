import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { ProjectReadiness } from "@/components/project/project-readiness";
import { useProjectWorkspace } from "@/lib/project-hooks";

export const Route = createFileRoute("/projects/$projectId/")({
  head: () => ({ meta: [{ title: "Project dashboard — BuildYard" }] }),
  component: ProjectDashboardPage,
});

function ProjectDashboardPage() {
  const { projectId } = Route.useParams();
  const { project, documents, categoryStates, ready } = useProjectWorkspace(projectId);

  if (!ready) {
    return <div className="mx-auto h-96 max-w-7xl animate-pulse bg-secondary" />;
  }
  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This project may belong to another browser or may have been removed.
        </p>
        <Button asChild className="mt-6">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const hasIfc = documents.some((document) => document.categoryId === "ifc-model");

  return (
    <div>
      <ProjectPageHeader
        eyebrow={project.buildingType}
        title={project.name}
        description={`${project.constructionMethod} · ${project.floorCount} floor${project.floorCount === 1 ? "" : "s"}`}
        backTo="/projects"
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/projects/$projectId/drawings" params={{ projectId }}>
                <FileStack className="size-4" /> Drawings
              </Link>
            </Button>
            <Button asChild disabled={!hasIfc}>
              <Link to="/projects/$projectId/model" params={{ projectId }}>
                <Box className="size-4" /> Open model
              </Link>
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ProjectReadiness project={project} documents={documents} categoryStates={categoryStates} />
      </div>
    </div>
  );
}
