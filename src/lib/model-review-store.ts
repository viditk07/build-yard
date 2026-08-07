import type { WorkPackageStatus } from "@/lib/sop";

export type ModelReviewWorkflow = {
  version: 1;
  projectId: string;
  modelDocumentId: string;
  reviewedElementIds: string[];
  materialElementIds: string[];
  sopStatuses: Partial<Record<string, WorkPackageStatus>>;
  updatedAt: string;
};

const STORAGE_PREFIX = "buildyard.model-review.v1";

function storageKey(projectId: string, modelDocumentId: string): string {
  return `${STORAGE_PREFIX}:${projectId}:${modelDocumentId}`;
}

export function emptyModelReviewWorkflow(
  projectId: string,
  modelDocumentId: string,
): ModelReviewWorkflow {
  return {
    version: 1,
    projectId,
    modelDocumentId,
    reviewedElementIds: [],
    materialElementIds: [],
    sopStatuses: {},
    updatedAt: new Date().toISOString(),
  };
}

export function readModelReviewWorkflow(
  projectId: string,
  modelDocumentId: string,
): ModelReviewWorkflow {
  const fallback = emptyModelReviewWorkflow(projectId, modelDocumentId);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId, modelDocumentId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ModelReviewWorkflow>;
    return {
      ...fallback,
      reviewedElementIds: Array.isArray(parsed.reviewedElementIds)
        ? parsed.reviewedElementIds.filter((value): value is string => typeof value === "string")
        : [],
      materialElementIds: Array.isArray(parsed.materialElementIds)
        ? parsed.materialElementIds.filter((value): value is string => typeof value === "string")
        : [],
      sopStatuses:
        parsed.sopStatuses && typeof parsed.sopStatuses === "object" ? parsed.sopStatuses : {},
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : fallback.updatedAt,
    };
  } catch {
    return fallback;
  }
}

export function writeModelReviewWorkflow(state: ModelReviewWorkflow): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey(state.projectId, state.modelDocumentId),
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  );
}
