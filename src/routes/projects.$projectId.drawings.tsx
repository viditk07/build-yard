import { createFileRoute, Link } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawingWorkspace } from "@/components/project/drawing-workspace";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { useProjectWorkspace } from "@/lib/project-hooks";

export const Route = createFileRoute("/projects/$projectId/drawings")({
  head: () => ({ meta: [{ title: "Drawing workspace — BuildYard" }] }),
  component: ProjectDrawingsPage,
});

function ProjectDrawingsPage() {
  const { projectId } = Route.useParams();
  const { project, documents, categoryStates, ready } = useProjectWorkspace(projectId);

  if (!ready) return <div className="mx-auto h-96 max-w-7xl animate-pulse bg-secondary" />;
  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Project not found</h1>
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
        eyebrow="Controlled document submission"
        title={`${project.name} drawings`}
        description="Upload each discipline under the correct heading, preserve revisions and approve the coordinated files before takeoff."
        backTo="/projects/$projectId"
        projectId={projectId}
        actions={
          hasIfc ? (
            <Button asChild>
              <Link to="/projects/$projectId/model" params={{ projectId }}>
                <Box className="size-4" /> Review IFC model
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <DrawingWorkspace project={project} documents={documents} categoryStates={categoryStates} />
      </div>
    </div>
  );
}
