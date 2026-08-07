import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, CheckCircle2, FileWarning, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { IfcViewer } from "@/components/ifc-viewer";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { SopProgress } from "@/components/sop-progress";
import { TakeoffPanel } from "@/components/takeoff-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectWorkspace } from "@/lib/project-hooks";
import {
  getCategoryProgressStatus,
  getDocumentBlob,
  updateDocumentStatus,
} from "@/lib/project-store";
import { DRAWING_CATEGORIES } from "@/lib/project-types";
import type { IfcElementMetadata, IfcModelSummary, IfcSource } from "@/lib/ifc-types";
import type { ModelElementSnapshot } from "@/lib/takeoff";

export const Route = createFileRoute("/projects/$projectId/model")({
  head: () => ({ meta: [{ title: "IFC model review — BuildYard" }] }),
  component: ProjectModelPage,
});

function ProjectModelPage() {
  const { projectId } = Route.useParams();
  const { project, documents, categoryStates, ready } = useProjectWorkspace(projectId);
  const latestIfc = documents.find((document) => document.categoryId === "ifc-model");
  const [source, setSource] = useState<IfcSource | null>(null);
  const [sourceError, setSourceError] = useState<string>();
  const [summary, setSummary] = useState<IfcModelSummary | null>(null);
  const [selection, setSelection] = useState<IfcElementMetadata | null>(null);

  useEffect(() => {
    let active = true;
    setSource(null);
    setSourceError(undefined);
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
      approved: latestIfc.status === "approved",
    };
    if (selection.predefinedType) element.predefinedType = selection.predefinedType;
    return element;
  }, [latestIfc, selection]);

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
        description="Inspect semantic building elements, approve the coordinated model and trace each material requirement back to its source."
        backTo="/projects/$projectId"
        projectId={projectId}
        actions={
          latestIfc ? (
            latestIfc.status === "approved" ? (
              <Badge className="h-9 gap-2 px-3">
                <CheckCircle2 className="size-4" /> Model approved
              </Badge>
            ) : (
              <Button
                onClick={() => {
                  updateDocumentStatus(latestIfc.id, "approved");
                  toast.success("IFC model approved for takeoff");
                }}
              >
                <CheckCircle2 className="size-4" /> Approve model
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
              Add the architect or BIM coordinator's IFC export under the IFC building model
              section.
            </p>
            <Button asChild className="mt-6">
              <Link to="/projects/$projectId/drawings" params={{ projectId }}>
                Open drawing workspace
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
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="min-w-0 space-y-4">
                <div className="surface-card rounded-2xl p-3">
                  <IfcViewer
                    source={source}
                    className="h-[68vh] min-h-[520px]"
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
                      <span>{summary.elementCount.toLocaleString("en-IN")} semantic elements</span>
                      <span>·</span>
                      <span>{summary.triangleCount.toLocaleString("en-IN")} triangles</span>
                    </>
                  )}
                </div>
              </div>
              <aside className="self-start xl:sticky xl:top-20">
                <TakeoffPanel {...(selectedElement ? { element: selectedElement } : {})} />
                <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <Box className="size-4 text-primary" /> MVP quantity gate
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Geometry-bound quantities are conservative estimates. Approve the IFC model,
                    then review every formula and assumption before adding supplier materials.
                  </p>
                </div>
              </aside>
            </div>
            <SopProgress
              readiness={{
                drawingsApproved,
                modelApproved: latestIfc.status === "approved",
                takeoffApproved: Boolean(selectedElement?.approved),
                materialsConfirmed: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
