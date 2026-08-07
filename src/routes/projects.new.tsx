import { createFileRoute } from "@tanstack/react-router";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { ProjectSetupForm } from "@/components/project/project-setup-form";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "Create project — BuildYard" }] }),
  component: NewProjectPage,
});

function NewProjectPage() {
  return (
    <div>
      <ProjectPageHeader
        eyebrow="New project"
        title="Set up the building brief"
        description="Define the site and building basics. BuildYard will create a structured drawing checklist for the IFC-first workflow."
        backTo="/projects"
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ProjectSetupForm />
      </div>
    </div>
  );
}
