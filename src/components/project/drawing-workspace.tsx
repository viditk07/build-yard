import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Droplets,
  FileBox,
  FileCheck2,
  FileClock,
  FileText,
  Flame,
  Layers3,
  LoaderCircle,
  Map,
  Paintbrush,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addProjectDocuments,
  deleteProjectDocument,
  getCategoryProgressStatus,
  getDocumentBlob,
  setCategoryNotApplicable,
  updateDocumentStatus,
} from "@/lib/project-store";
import {
  DRAWING_CATEGORIES,
  drawingStatusLabel,
  formatFileSize,
  type CategoryProgressStatus,
  type CategoryState,
  type DrawingStatus,
  type DrawingUploadMetadata,
  type Project,
  type ProjectDocument,
} from "@/lib/project-types";

type DrawingWorkspaceProps = {
  project: Project;
  documents: ProjectDocument[];
  categoryStates: CategoryState[];
};

const categoryIcons = {
  site: Map,
  architectural: Layers3,
  structural: Wrench,
  plumbing: Droplets,
  electrical: Zap,
  hvac: Wind,
  "fire-safety": Flame,
  interiors: Paintbrush,
  "external-works": Map,
  specifications: FileText,
  "ifc-model": Box,
} as const;

const categoryStatusLabels: Record<CategoryProgressStatus, string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  needs_review: "Needs review",
  needs_revision: "Needs revision",
  approved: "Approved",
  not_applicable: "Not applicable",
};

const sampleFiles: Partial<Record<string, { name: string; href: string }>> = {
  architectural: {
    name: "Sample floor plan (DXF)",
    href: "/samples/buildyard-demo/sample-floor-plan.dxf",
  },
  structural: {
    name: "Sample structural plan (DXF)",
    href: "/samples/buildyard-demo/sample-structural-plan.dxf",
  },
  plumbing: {
    name: "Sample plumbing plan (DXF)",
    href: "/samples/buildyard-demo/sample-plumbing-plan.dxf",
  },
  electrical: {
    name: "Sample electrical plan (DXF)",
    href: "/samples/buildyard-demo/sample-electrical-plan.dxf",
  },
  specifications: {
    name: "Sample material schedule (CSV)",
    href: "/samples/buildyard-demo/sample-material-schedule.csv",
  },
  "ifc-model": {
    name: "Sample house elements (IFC)",
    href: "/samples/buildyard-demo/sample-house-elements.ifc",
  },
};

const initialMetadata: DrawingUploadMetadata = {
  title: "",
  drawingNumber: "",
  revision: "P01",
  drawingDate: "",
  floor: "All floors",
  author: "",
  notes: "",
};

function statusClasses(status: CategoryProgressStatus): string {
  if (status === "approved") return "border-green-700/20 bg-green-600/10 text-green-700";
  if (status === "needs_revision") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  if (status === "needs_review" || status === "uploaded") {
    return "border-amber-700/20 bg-amber-500/10 text-amber-700";
  }
  return "border-border bg-secondary text-muted-foreground";
}

export function DrawingWorkspace({ project, documents, categoryStates }: DrawingWorkspaceProps) {
  const firstMissing = DRAWING_CATEGORIES.find(
    (category) =>
      category.required &&
      getCategoryProgressStatus(category.id, documents, categoryStates) === "missing",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    firstMissing?.id ?? DRAWING_CATEGORIES[0]!.id,
  );
  const selectedCategory =
    DRAWING_CATEGORIES.find((category) => category.id === selectedCategoryId) ??
    DRAWING_CATEGORIES[0]!;
  const selectedDocuments = documents.filter(
    (document) => document.categoryId === selectedCategory.id,
  );
  const selectedState = categoryStates.find((state) => state.categoryId === selectedCategory.id);

  const suppliedRequiredCount = useMemo(
    () =>
      DRAWING_CATEGORIES.filter(
        (category) =>
          category.required &&
          getCategoryProgressStatus(category.id, documents, categoryStates) !== "missing",
      ).length,
    [categoryStates, documents],
  );
  const requiredCount = DRAWING_CATEGORIES.filter((category) => category.required).length;
  const completion = Math.round((suppliedRequiredCount / requiredCount) * 100);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="self-start xl:sticky xl:top-20">
        <div className="surface-card overflow-hidden rounded-2xl">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-spec text-muted-foreground">Minimum project package</p>
              <span className="text-sm font-semibold text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {suppliedRequiredCount} of {requiredCount} required sections supplied
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-destructive">*</span> Required. All unstarred
              sections are optional and can be added later.
            </p>
          </div>
          <nav className="max-h-[65vh] overflow-y-auto p-2" aria-label="Drawing categories">
            {DRAWING_CATEGORIES.map((category) => {
              const status = getCategoryProgressStatus(category.id, documents, categoryStates);
              const count = documents.filter(
                (document) => document.categoryId === category.id,
              ).length;
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? FileText;
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    selectedCategory.id === category.id
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg border",
                      statusClasses(status),
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="truncate">{category.name}</span>
                      {category.required && (
                        <span className="text-destructive" aria-label="Required">
                          *
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {!category.required && status === "missing"
                        ? "Optional"
                        : categoryStatusLabels[status]}
                      {count > 0 ? ` · ${count} file${count === 1 ? "" : "s"}` : ""}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 space-y-6">
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-spec text-primary">{selectedCategory.discipline}</p>
                <Badge variant="outline">
                  {selectedCategory.required ? "Required *" : "Optional"}
                </Badge>
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{selectedCategory.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {selectedCategory.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Typical: {selectedCategory.examples.join(" · ")}
              </p>
            </div>
            <Badge
              variant="outline"
              className={statusClasses(
                getCategoryProgressStatus(selectedCategory.id, documents, categoryStates),
              )}
            >
              {
                categoryStatusLabels[
                  getCategoryProgressStatus(selectedCategory.id, documents, categoryStates)
                ]
              }
            </Badge>
          </div>

          {selectedState?.notApplicable ? (
            <div className="mt-6 rounded-xl border border-border bg-secondary/70 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="size-4 text-primary" /> Marked not applicable
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedState.reason || "No reason provided."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCategoryNotApplicable(project.id, selectedCategory.id, false, "")
                  }
                >
                  <RotateCcw className="size-4" /> Reopen section
                </Button>
              </div>
            </div>
          ) : (
            <UploadDrawingPanel project={project} categoryId={selectedCategory.id} />
          )}
        </section>

        {!selectedState?.notApplicable && (
          <DocumentList categoryId={selectedCategory.id} documents={selectedDocuments} />
        )}

        {!selectedState?.notApplicable && !selectedCategory.required && (
          <NotApplicablePanel projectId={project.id} categoryId={selectedCategory.id} />
        )}
      </main>
    </div>
  );
}

function UploadDrawingPanel({ project, categoryId }: { project: Project; categoryId: string }) {
  const category = DRAWING_CATEGORIES.find((item) => item.id === categoryId)!;
  const sampleFile = sampleFiles[categoryId];
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<DrawingUploadMetadata>(initialMetadata);
  const [uploading, setUploading] = useState(false);

  const updateMetadata = <Key extends keyof DrawingUploadMetadata>(
    key: Key,
    value: DrawingUploadMetadata[Key],
  ) => setMetadata((current) => ({ ...current, [key]: value }));

  const selectFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected);
    const invalidIfc =
      categoryId === "ifc-model" &&
      next.some((file) => !file.name.toLocaleLowerCase().endsWith(".ifc"));
    if (invalidIfc) {
      toast.error("The IFC model section only accepts .ifc files.");
      return;
    }
    const oversized = next.find((file) => file.size > 150 * 1024 * 1024);
    if (oversized) {
      toast.error(`${oversized.name} exceeds the 150 MB browser-storage limit.`);
      return;
    }
    setFiles(next);
    if (next.length === 1 && !metadata.title) {
      updateMetadata("title", next[0]!.name.replace(/\.[^.]+$/, ""));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      toast.error("Choose at least one file to upload.");
      return;
    }
    setUploading(true);
    try {
      const saved = await addProjectDocuments(project.id, categoryId, files, metadata);
      toast.success(`${saved.length} file${saved.length === 1 ? "" : "s"} uploaded`, {
        description: "The submission is ready for review.",
      });
      setFiles([]);
      setMetadata(initialMetadata);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      toast.error("The files could not be saved", {
        description: error instanceof Error ? error.message : "Browser storage may be full.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 border-t border-border pt-6">
      {sampleFile && (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">Need a file to test this section?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Download the included demo file, then upload it below.
            </p>
          </div>
          <Button asChild type="button" variant="outline" size="sm">
            <a href={sampleFile.href} download>
              <Download className="size-4" /> {sampleFile.name}
            </a>
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-8 text-center transition-colors hover:bg-primary/10"
      >
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
          <UploadCloud className="size-5" />
        </span>
        <span className="mt-3 text-sm font-semibold">Choose one or more files</span>
        <span className="mt-1 text-xs text-muted-foreground">
          {categoryId === "ifc-model"
            ? "IFC model · max 150 MB"
            : "PDF, image, CAD or office document · max 150 MB each"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={category.acceptedFiles}
        className="sr-only"
        onChange={(event) => selectFiles(event.target.files)}
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2"
            >
              <FileBox className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                aria-label={`Remove ${file.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Label htmlFor={`title-${categoryId}`}>Drawing/model title</Label>
          <Input
            id={`title-${categoryId}`}
            className="mt-2"
            value={metadata.title}
            onChange={(event) => updateMetadata("title", event.target.value)}
            placeholder="Uses the filename if left blank"
          />
        </div>
        <div>
          <Label htmlFor={`drawing-number-${categoryId}`}>Drawing number</Label>
          <Input
            id={`drawing-number-${categoryId}`}
            className="mt-2"
            value={metadata.drawingNumber}
            onChange={(event) => updateMetadata("drawingNumber", event.target.value)}
            placeholder="A-101"
          />
        </div>
        <div>
          <Label htmlFor={`revision-${categoryId}`}>Revision</Label>
          <Input
            id={`revision-${categoryId}`}
            className="mt-2"
            value={metadata.revision}
            onChange={(event) => updateMetadata("revision", event.target.value)}
            placeholder="P01"
          />
        </div>
        <div>
          <Label htmlFor={`drawing-date-${categoryId}`}>Drawing date</Label>
          <Input
            id={`drawing-date-${categoryId}`}
            className="mt-2"
            type="date"
            value={metadata.drawingDate}
            onChange={(event) => updateMetadata("drawingDate", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`floor-${categoryId}`}>Floor / level</Label>
          <Input
            id={`floor-${categoryId}`}
            className="mt-2"
            value={metadata.floor}
            onChange={(event) => updateMetadata("floor", event.target.value)}
            placeholder="Ground floor"
          />
        </div>
        <div className="lg:col-span-2">
          <Label htmlFor={`author-${categoryId}`}>Author / consultant</Label>
          <Input
            id={`author-${categoryId}`}
            className="mt-2"
            value={metadata.author}
            onChange={(event) => updateMetadata("author", event.target.value)}
            placeholder="Architect or consultant name"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor={`notes-${categoryId}`}>Submission notes</Label>
          <Textarea
            id={`notes-${categoryId}`}
            className="mt-2"
            value={metadata.notes}
            onChange={(event) => updateMetadata("notes", event.target.value)}
            placeholder="Scope, coordination notes or assumptions"
          />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={uploading || files.length === 0}>
          {uploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {uploading ? "Saving files…" : "Add to submission"}
        </Button>
      </div>
    </form>
  );
}

function DocumentList({
  categoryId,
  documents,
}: {
  categoryId: string;
  documents: ProjectDocument[];
}) {
  const [deletingId, setDeletingId] = useState<string>();

  const download = async (document: ProjectDocument) => {
    try {
      const blob = await getDocumentBlob(document);
      if (!blob) throw new Error("The local file is missing.");
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      toast.error("Could not download the file", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const remove = async (document: ProjectDocument) => {
    if (deletingId !== document.id) {
      setDeletingId(document.id);
      window.setTimeout(() => setDeletingId(undefined), 4_000);
      return;
    }
    try {
      await deleteProjectDocument(document.id);
      toast.success("Drawing removed");
    } catch (error) {
      toast.error("Could not remove the file", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeletingId(undefined);
    }
  };

  return (
    <section className="surface-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Submission history</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            New files with the same title are numbered as successive versions.
          </p>
        </div>
        <Badge variant="secondary">{documents.length}</Badge>
      </div>
      {documents.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <FileClock className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">No files in this section</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add the first issue using the submission form above.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {documents.map((document) => (
            <article key={document.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  {categoryId === "ifc-model" ? (
                    <Box className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{document.title}</h3>
                    <Badge variant="outline">v{document.version}</Badge>
                    <Badge
                      variant="outline"
                      className={statusClasses(
                        document.status === "uploaded" ? "uploaded" : document.status,
                      )}
                    >
                      {drawingStatusLabel(document.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {document.fileName} · {formatFileSize(document.fileSize)}
                  </p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">Drawing no.</dt>
                      <dd className="mt-0.5 font-medium">{document.drawingNumber || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Revision</dt>
                      <dd className="mt-0.5 font-medium">{document.revision}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Floor</dt>
                      <dd className="mt-0.5 font-medium">{document.floor}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Uploaded</dt>
                      <dd className="mt-0.5 font-medium">
                        {new Date(document.uploadedAt).toLocaleDateString("en-IN")}
                      </dd>
                    </div>
                  </dl>
                  {document.notes && (
                    <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                      {document.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${document.id}`}>
                    Review status
                  </label>
                  <select
                    id={`status-${document.id}`}
                    value={document.status}
                    onChange={(event) => {
                      updateDocumentStatus(document.id, event.target.value as DrawingStatus);
                      toast.success("Review status updated");
                    }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="needs_review">Needs review</option>
                    <option value="approved">Approved</option>
                    <option value="needs_revision">Needs revision</option>
                    <option value="uploaded">Uploaded</option>
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => void download(document)}
                    aria-label={`Download ${document.fileName}`}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant={deletingId === document.id ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => void remove(document)}
                    aria-label={
                      deletingId === document.id
                        ? `Confirm removal of ${document.fileName}`
                        : `Remove ${document.fileName}`
                    }
                  >
                    {deletingId === document.id ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              {deletingId === document.id && (
                <p className="mt-2 text-right text-xs text-destructive">
                  Click the red button again to permanently remove this local file.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function NotApplicablePanel({ projectId, categoryId }: { projectId: string; categoryId: string }) {
  const [reason, setReason] = useState("");

  return (
    <section className="rounded-2xl border border-dashed border-border p-5">
      <h2 className="text-sm font-semibold">This section does not apply?</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Record why it is excluded so reviewers can audit the checklist decision.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason this discipline is not required"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!reason.trim()}
          onClick={() => {
            setCategoryNotApplicable(projectId, categoryId, true, reason);
            toast.success("Section marked not applicable");
          }}
        >
          Mark not applicable
        </Button>
      </div>
    </section>
  );
}
