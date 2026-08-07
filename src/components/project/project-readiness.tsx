import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  FileStack,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { readModelReviewWorkflow } from "@/lib/model-review-store";
import { DRAWING_CATEGORIES } from "@/lib/project-types";
import { getCategoryProgressStatus } from "@/lib/project-store";
import type { CategoryState, Project, ProjectDocument } from "@/lib/project-types";

type ProjectReadinessProps = {
  project: Project;
  documents: ProjectDocument[];
  categoryStates: CategoryState[];
};

export function ProjectReadiness({ project, documents, categoryStates }: ProjectReadinessProps) {
  const requiredCategories = DRAWING_CATEGORIES.filter((category) => category.required);
  const completeRequired = requiredCategories.filter((category) => {
    const status = getCategoryProgressStatus(category.id, documents, categoryStates);
    return status !== "missing" && status !== "needs_revision";
  }).length;
  const approvedCategories = DRAWING_CATEGORIES.filter(
    (category) => getCategoryProgressStatus(category.id, documents, categoryStates) === "approved",
  ).length;
  const progress = Math.round((completeRequired / requiredCategories.length) * 100);
  const ifcDocuments = documents.filter((document) => document.categoryId === "ifc-model");
  const latestIfc = ifcDocuments[0];
  const modelWorkflow = latestIfc ? readModelReviewWorkflow(project.id, latestIfc.id) : undefined;
  const reviewedElementCount = modelWorkflow?.reviewedElementIds.length ?? 0;
  const materialsAdded = (modelWorkflow?.materialElementIds.length ?? 0) > 0;

  const workflow = [
    {
      label: "Drawing set",
      description: `${completeRequired}/${requiredCategories.length} required sections supplied`,
      complete: completeRequired === requiredCategories.length,
      icon: FileStack,
    },
    {
      label: "IFC model",
      description: latestIfc
        ? `${latestIfc.fileName} · ${latestIfc.revision}`
        : "Awaiting IFC upload",
      complete: latestIfc?.status === "approved",
      icon: Box,
    },
    {
      label: "Quantity takeoff",
      description:
        reviewedElementCount > 0
          ? `${reviewedElementCount} model element${reviewedElementCount === 1 ? "" : "s"} reviewed`
          : "Select and review an element in the model",
      complete: reviewedElementCount > 0,
      icon: FileCheck2,
    },
    {
      label: "Supplier quote",
      description: materialsAdded
        ? "Reviewed materials added to the cart"
        : "Add a reviewed material to continue",
      complete: materialsAdded,
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-spec text-primary">Submission readiness</p>
              <h2 className="mt-2 text-xl font-semibold">Complete the minimum package</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only starred sections are required. Optional disciplines can be uploaded later and
                do not block IFC model review.
              </p>
            </div>
            <span className="font-display text-3xl font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-5" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">{documents.length} files</Badge>
            <Badge variant="secondary">{approvedCategories} sections approved</Badge>
            <Badge variant={latestIfc ? "default" : "outline"}>
              {latestIfc ? "IFC supplied" : "IFC required"}
            </Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {latestIfc && (
              <Button asChild>
                <Link to="/projects/$projectId/model" params={{ projectId: project.id }}>
                  Continue model review <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant={latestIfc ? "outline" : "default"}>
              <Link to="/projects/$projectId/drawings" params={{ projectId: project.id }}>
                {latestIfc ? "Manage drawings" : "Upload IFC model"}
              </Link>
            </Button>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <p className="text-spec text-muted-foreground">End-to-end workflow</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {workflow.map((step, index) => (
              <li key={step.label} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                      step.complete
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step.complete ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <step.icon className="size-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                    <h3 className="mt-0.5 text-sm font-semibold">{step.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface-card rounded-2xl p-5">
          <p className="text-spec text-muted-foreground">Project brief</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="mt-1 flex items-start gap-2 font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {project.address} · {project.pinCode}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Building</dt>
                <dd className="mt-1 font-medium">{project.buildingType}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Floors</dt>
                <dd className="mt-1 font-medium">{project.floorCount}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Built-up area</dt>
                <dd className="mt-1 font-medium">
                  {project.builtUpArea.toLocaleString("en-IN")}{" "}
                  {project.unitSystem === "metric" ? "m²" : "ft²"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Target start</dt>
                <dd className="mt-1 font-medium">{project.targetStartDate || "Not set"}</dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <CircleDashed className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Approval gates protect procurement</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Uploaded files, the IFC model and material quantities are approved separately so
                estimates never silently become orders.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
