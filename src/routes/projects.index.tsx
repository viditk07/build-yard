import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileStack, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { useProjects, useProjectWorkspace } from "@/lib/project-hooks";
import type { Project } from "@/lib/project-types";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — BuildYard" },
      {
        name: "description",
        content: "Manage house designs, IFC models, takeoffs and procurement packages.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, ready } = useProjects();

  return (
    <div>
      <ProjectPageHeader
        eyebrow="Design to procurement"
        title="Your projects"
        description="Manage drawing submissions, IFC models, material takeoffs and supplier procurement in one workspace."
        actions={
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="size-4" /> New project
            </Link>
          </Button>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <section className="surface-card rounded-2xl px-5 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Start with your first house project</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Set up the site, upload the coordinated drawing set and add an IFC model to unlock
              model-based material takeoff.
            </p>
            <Button asChild className="mt-6">
              <Link to="/projects/new">
                Create a project <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { documents } = useProjectWorkspace(project.id);
  const ifcCount = documents.filter((document) => document.categoryId === "ifc-model").length;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="surface-card group flex min-h-52 flex-col rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{project.name}</h2>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3 shrink-0" /> {project.address} · {project.pinCode}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileStack className="size-3.5" /> {documents.length} files
        </span>
        <span>{ifcCount > 0 ? "IFC supplied" : "IFC required"}</span>
      </div>
    </Link>
  );
}
