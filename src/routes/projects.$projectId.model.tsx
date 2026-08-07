import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  LoaderCircle,
  MousePointer2,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { IfcViewer } from "@/components/ifc-viewer";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { SopProgress } from "@/components/sop-progress";
import { TakeoffPanel } from "@/components/takeoff-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IfcElementMetadata, IfcModelSummary, IfcSource } from "@/lib/ifc-types";
import {
  emptyModelReviewWorkflow,
  readModelReviewWorkflow,
  writeModelReviewWorkflow,
  type ModelReviewWorkflow,
} from "@/lib/model-review-store";
import { useProjectWorkspace } from "@/lib/project-hooks";
import {
  getCategoryProgressStatus,
  getDocumentBlob,
  updateDocumentStatus,
} from "@/lib/project-store";
import { DRAWING_CATEGORIES } from "@/lib/project-types";
import type { WorkPackageStatus } from "@/lib/sop";
import type { ModelElementSnapshot } from "@/lib/takeoff";

export const Route = createFileRoute("/projects/$projectId/model")({
  head: () => ({ meta: [{ title: "IFC model review — BuildYard" }] }),
  component: ProjectModelPage,
});

type ReviewStepsProps = {
  modelApproved: boolean;
  hasSelection: boolean;
  hasReviewedElement: boolean;
  selectedElementReviewed: boolean;
  materialsAdded: boolean;
  onApproveModel: () => void;
};

function ReviewSteps({
  modelApproved,
  hasSelection,
  hasReviewedElement,
  selectedElementReviewed,
  materialsAdded,
  onApproveModel,
}: ReviewStepsProps) {
  const steps = [
    { label: "Approve model", complete: modelApproved },
    { label: "Select element", complete: hasSelection || hasReviewedElement },
    { label: "Review quantities", complete: hasReviewedElement },
    { label: "Add materials", complete: materialsAdded },
  ];
  const completeCount = steps.filter((step) => step.complete).length;

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-spec text-primary">Guided model review</p>
          <h2 className="mt-1 text-xl font-semibold">Follow these four steps</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The next available action is highlighted. You can return and review more elements at any
            time.
          </p>
        </div>
        <Badge variant={completeCount === steps.length ? "default" : "secondary"}>
          {completeCount}/{steps.length} complete
        </Badge>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const current = !step.complete && steps.slice(0, index).every((item) => item.complete);
          return (
            <li
              key={step.label}
              className={`rounded-xl border p-3 ${
                step.complete
                  ? "border-emerald-200 bg-emerald-50"
                  : current
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-secondary/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-6 place-items-center rounded-full text-[11px] font-semibold ${
                    step.complete
                      ? "bg-emerald-600 text-white"
                      : current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.complete ? <CheckCircle2 className="size-3.5" /> : index + 1}
                </span>
                <span className="text-xs font-semibold">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/50 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">
            {!modelApproved
              ? "First, approve this IFC revision"
              : !hasSelection && !materialsAdded
                ? "Now click a building element in the viewer"
                : hasSelection && !selectedElementReviewed
                  ? "Review the selected element's quantities"
                  : !materialsAdded
                    ? "Add the reviewed element's materials"
                    : "Model-to-material review is active"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {!modelApproved
              ? "This confirms the model revision that will be used for takeoff."
              : !hasSelection && !materialsAdded
                ? "Walls, slabs, columns, doors, windows, and services can be selected."
                : hasSelection && !selectedElementReviewed
                  ? "Check the formula and assumptions in the element review panel."
                  : !materialsAdded
                    ? "Choose individual products or add every matched material line."
                    : "Continue reviewing elements, open the cart, or advance the SOP below."}
          </p>
        </div>
        <div className="shrink-0">
          {!modelApproved ? (
            <Button onClick={onApproveModel}>
              <CheckCircle2 /> Approve IFC model
            </Button>
          ) : !hasSelection && !materialsAdded ? (
            <span className="flex items-center gap-2 text-xs font-medium text-primary">
              <MousePointer2 className="size-4" /> Select an element in the model
            </span>
          ) : hasSelection && !selectedElementReviewed ? (
            <Button asChild>
              <a href="#element-review">
                Review selected element <ArrowRight />
              </a>
            </Button>
          ) : hasReviewedElement && !materialsAdded ? (
            <Button asChild>
              <a href="#element-review">
                Choose materials <ArrowRight />
              </a>
            </Button>
          ) : materialsAdded ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="#project-sop">Open project SOP</a>
              </Button>
              <Button asChild>
                <Link to="/cart">
                  <ShoppingCart /> Open cart
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProjectModelPage() {
  const { projectId } = Route.useParams();
  const { project, documents, categoryStates, ready } = useProjectWorkspace(projectId);
  const latestIfc = documents.find((document) => document.categoryId === "ifc-model");
  const [source, setSource] = useState<IfcSource | null>(null);
  const [sourceError, setSourceError] = useState<string>();
  const [summary, setSummary] = useState<IfcModelSummary | null>(null);
  const [selection, setSelection] = useState<IfcElementMetadata | null>(null);
  const [workflow, setWorkflow] = useState<ModelReviewWorkflow>(() =>
    emptyModelReviewWorkflow(projectId, "pending-model"),
  );

  useEffect(() => {
    if (!latestIfc) {
      setWorkflow(emptyModelReviewWorkflow(projectId, "pending-model"));
      return;
    }
    setWorkflow(readModelReviewWorkflow(projectId, latestIfc.id));
  }, [latestIfc, projectId]);

  useEffect(() => {
    let active = true;
    setSource(null);
    setSourceError(undefined);
    setSelection(null);
    if (!latestIfc) return () => undefined;

    void getDocumentBlob(latestIfc)
      .then((blob) => {
        if (!active) return;
        if (!blob) throw new Error("The IFC file is no longer available in browser storage.");
        setSource(
          new File([blob], latestIfc.fileName, {
            type: latestIfc.fileType,
            lastModified: new Date(latestIfc.uploadedAt).getTime(),
          }),
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setSourceError(
            error instanceof Error ? error.message : "Could not retrieve the IFC file.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [latestIfc]);

  const activeWorkflow =
    latestIfc && workflow.modelDocumentId === latestIfc.id
      ? workflow
      : emptyModelReviewWorkflow(projectId, latestIfc?.id ?? "pending-model");
  const modelApproved = latestIfc?.status === "approved";
  const selectedElementId = selection
    ? (selection.globalId ?? `express-${selection.expressID}`)
    : undefined;
  const selectedElementReviewed = selectedElementId
    ? activeWorkflow.reviewedElementIds.includes(selectedElementId)
    : false;
  const hasReviewedElement = activeWorkflow.reviewedElementIds.length > 0;
  const materialsAdded = activeWorkflow.materialElementIds.length > 0;

  const updateWorkflow = (update: (current: ModelReviewWorkflow) => ModelReviewWorkflow) => {
    setWorkflow((current) => {
      const base =
        latestIfc && current.modelDocumentId === latestIfc.id
          ? current
          : emptyModelReviewWorkflow(projectId, latestIfc?.id ?? "pending-model");
      const next = update(base);
      writeModelReviewWorkflow(next);
      return next;
    });
  };

  const approveModel = () => {
    if (!latestIfc) return;
    updateDocumentStatus(latestIfc.id, "approved");
    toast.success("IFC model approved", {
      description: "Select an element to review its material takeoff.",
    });
  };

  const reviewSelectedElement = () => {
    if (!selectedElementId) return;
    updateWorkflow((current) => ({
      ...current,
      reviewedElementIds: Array.from(new Set([...current.reviewedElementIds, selectedElementId])),
    }));
    toast.success("Element marked reviewed", {
      description: "Material actions are now unlocked for this element.",
    });
  };

  const confirmSelectedMaterials = () => {
    if (!selectedElementId) return;
    updateWorkflow((current) => ({
      ...current,
      materialElementIds: Array.from(new Set([...current.materialElementIds, selectedElementId])),
    }));
  };

  const updateSopStatus = (workPackageId: string, status: WorkPackageStatus) => {
    updateWorkflow((current) => ({
      ...current,
      sopStatuses: { ...current.sopStatuses, [workPackageId]: status },
    }));
    toast.success(status === "complete" ? "Work package completed" : "Work package started");
  };

  const selectedElement = useMemo<ModelElementSnapshot | undefined>(() => {
    if (!selection || !latestIfc) return undefined;
    const element: ModelElementSnapshot = {
      globalId: selection.globalId ?? `IFC-${selection.expressID}`,
      ifcClass: selection.typeName,
      name: selection.name ?? selection.typeName,
      modelRevision: latestIfc.revision,
      quantities: selection.estimatedQuantities
        ? {
            lengthM: selection.estimatedQuantities.lengthM,
            widthM: selection.estimatedQuantities.widthM,
            heightM: selection.estimatedQuantities.heightM,
            grossAreaM2: selection.estimatedQuantities.grossAreaM2,
            netAreaM2: selection.estimatedQuantities.netAreaM2,
            volumeM3: selection.estimatedQuantities.volumeM3,
            count: selection.estimatedQuantities.count,
          }
        : { count: 1 },
      quantitySource: selection.estimatedQuantities ? "derived-from-geometry" : "recipe-default",
      approved: Boolean(modelApproved && selectedElementReviewed),
    };
    if (selection.predefinedType) element.predefinedType = selection.predefinedType;
    return element;
  }, [latestIfc, modelApproved, selectedElementReviewed, selection]);

  const drawingsApproved = DRAWING_CATEGORIES.filter(
    (category) => category.required && category.id !== "ifc-model",
  ).every((category) => {
    const status = getCategoryProgressStatus(category.id, documents, categoryStates);
    return status === "approved" || status === "not_applicable";
  });

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

  return (
    <div>
      <ProjectPageHeader
        eyebrow="IFC model review"
        title={project.name}
        description="Orient the model, select an element, review its quantities, and move matched materials into procurement."
        backTo="/projects/$projectId"
        projectId={projectId}
        actions={
          latestIfc ? (
            modelApproved ? (
              <Badge className="h-9 gap-2 px-3">
                <CheckCircle2 className="size-4" /> Model approved
              </Badge>
            ) : (
              <Button onClick={approveModel}>
                <CheckCircle2 className="size-4" /> Approve IFC model
              </Button>
            )
          ) : undefined
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!latestIfc ? (
          <section className="surface-card rounded-2xl px-5 py-16 text-center">
            <FileWarning className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Upload an IFC model first</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              The IFC model is the only required file for the MVP model-to-material workflow.
            </p>
            <Button asChild className="mt-6">
              <Link to="/projects/$projectId/drawings" params={{ projectId }}>
                Upload or download the sample IFC
              </Link>
            </Button>
          </section>
        ) : sourceError ? (
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="font-semibold text-destructive">The IFC source is unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">{sourceError}</p>
          </section>
        ) : !source ? (
          <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Retrieving {latestIfc.fileName}…
          </div>
        ) : (
          <div className="space-y-6">
            <ReviewSteps
              modelApproved={modelApproved}
              hasSelection={Boolean(selection)}
              hasReviewedElement={hasReviewedElement}
              selectedElementReviewed={selectedElementReviewed}
              materialsAdded={materialsAdded}
              onApproveModel={approveModel}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
              <div className="min-w-0 space-y-4">
                <div className="surface-card rounded-2xl p-3">
                  <IfcViewer
                    source={source}
                    className="h-[72vh] min-h-[560px]"
                    onSelectionChange={setSelection}
                    onSummaryChange={setSummary}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{latestIfc.fileName}</Badge>
                  <span>Revision {latestIfc.revision}</span>
                  {summary && (
                    <>
                      <span>·</span>
                      <span>
                        {summary.elementCount.toLocaleString("en-IN")} selectable elements
                      </span>
                      <span>·</span>
                      <span>{summary.triangleCount.toLocaleString("en-IN")} triangles</span>
                    </>
                  )}
                </div>
              </div>
              <aside id="element-review" className="scroll-mt-24 self-start xl:sticky xl:top-20">
                <TakeoffPanel
                  {...(selectedElement ? { element: selectedElement } : {})}
                  modelApproved={modelApproved}
                  reviewed={selectedElementReviewed}
                  onReview={reviewSelectedElement}
                  onMaterialAdded={confirmSelectedMaterials}
                />
                <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <ClipboardCheck className="size-4 text-primary" /> Review rule
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Derived quantities are estimates. Review the formula and assumptions for each
                    selected element before adding materials.
                  </p>
                </div>
              </aside>
            </div>

            <SopProgress
              readiness={{
                drawingsApproved,
                modelApproved,
                takeoffApproved: hasReviewedElement,
                materialsConfirmed: materialsAdded,
              }}
              statuses={activeWorkflow.sopStatuses}
              onStatusChange={updateSopStatus}
            />
          </div>
        )}
      </div>
    </div>
  );
}
