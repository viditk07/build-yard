import type {
  CategoryProgressStatus,
  CategoryState,
  DrawingStatus,
  DrawingUploadMetadata,
  Project,
  ProjectDocument,
  ProjectInput,
} from "@/lib/project-types";

type StoreSnapshot = {
  version: 1;
  projects: Project[];
  documents: ProjectDocument[];
  categoryStates: CategoryState[];
};

const STORAGE_KEY = "buildyard.projects.v1";
const CHANGE_EVENT = "buildyard:projects-changed";
const DATABASE_NAME = "buildyard-project-files";
const DATABASE_VERSION = 1;
const BLOB_STORE = "drawing-blobs";

const EMPTY_STORE: StoreSnapshot = {
  version: 1,
  projects: [],
  documents: [],
  categoryStates: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readStore(): StoreSnapshot {
  if (!isBrowser()) return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
    return {
      version: 1,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      categoryStates: Array.isArray(parsed.categoryStates) ? parsed.categoryStates : [],
    };
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(snapshot: StoreSnapshot): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("File storage is not supported in this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(BLOB_STORE)) {
        request.result.createObjectStore(BLOB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open file storage."));
  });
}

async function putBlob(id: string, file: Blob): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(BLOB_STORE, "readwrite");
    transaction.objectStore(BLOB_STORE).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save file."));
    transaction.onabort = () => reject(transaction.error ?? new Error("File save was cancelled."));
  });
  database.close();
}

async function removeBlob(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(BLOB_STORE, "readwrite");
    transaction.objectStore(BLOB_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove file."));
  });
  database.close();
}

export function subscribeProjectStore(listener: () => void): () => void {
  if (!isBrowser()) return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function listProjects(): Project[] {
  return [...readStore().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(projectId: string): Project | undefined {
  return readStore().projects.find((project) => project.id === projectId);
}

export function createProject(input: ProjectInput): Project {
  const snapshot = readStore();
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id: createId("project"),
    createdAt: now,
    updatedAt: now,
  };
  writeStore({ ...snapshot, projects: [...snapshot.projects, project] });
  return project;
}

export function listProjectDocuments(projectId: string): ProjectDocument[] {
  return readStore()
    .documents.filter((document) => document.projectId === projectId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getCategoryStates(projectId: string): CategoryState[] {
  return readStore().categoryStates.filter((state) => state.projectId === projectId);
}

export async function addProjectDocuments(
  projectId: string,
  categoryId: string,
  files: readonly File[],
  metadata: DrawingUploadMetadata,
): Promise<ProjectDocument[]> {
  const savedDocuments: ProjectDocument[] = [];
  const storedBlobIds: string[] = [];

  try {
    for (const file of files) {
      const blobId = createId("blob");
      await putBlob(blobId, file);
      storedBlobIds.push(blobId);
      const snapshot = readStore();
      const baseTitle = metadata.title.trim() || file.name.replace(/\.[^.]+$/, "");
      const related = snapshot.documents.filter(
        (document) =>
          document.projectId === projectId &&
          document.categoryId === categoryId &&
          document.title.toLocaleLowerCase() === baseTitle.toLocaleLowerCase(),
      );
      const now = new Date().toISOString();
      const document: ProjectDocument = {
        id: createId("drawing"),
        projectId,
        categoryId,
        title:
          files.length > 1 && metadata.title.trim() ? `${baseTitle} — ${file.name}` : baseTitle,
        drawingNumber: metadata.drawingNumber.trim(),
        revision: metadata.revision.trim() || "P01",
        version: Math.max(0, ...related.map((item) => item.version)) + 1,
        drawingDate: metadata.drawingDate,
        floor: metadata.floor.trim() || "All floors",
        author: metadata.author.trim(),
        notes: metadata.notes.trim(),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        blobId,
        status: "needs_review",
        uploadedAt: now,
        updatedAt: now,
      };
      const project = snapshot.projects.find((item) => item.id === projectId);
      const projects = project
        ? snapshot.projects.map((item) =>
            item.id === projectId ? { ...item, updatedAt: now } : item,
          )
        : snapshot.projects;
      writeStore({
        ...snapshot,
        projects,
        documents: [...snapshot.documents, document],
      });
      savedDocuments.push(document);
    }
    return savedDocuments;
  } catch (error) {
    await Promise.allSettled(storedBlobIds.map((blobId) => removeBlob(blobId)));
    throw error;
  }
}

export function updateDocumentStatus(documentId: string, status: DrawingStatus): void {
  const snapshot = readStore();
  const now = new Date().toISOString();
  writeStore({
    ...snapshot,
    documents: snapshot.documents.map((document) =>
      document.id === documentId ? { ...document, status, updatedAt: now } : document,
    ),
  });
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  const snapshot = readStore();
  const document = snapshot.documents.find((item) => item.id === documentId);
  if (!document) return;
  await removeBlob(document.blobId);
  writeStore({
    ...snapshot,
    documents: snapshot.documents.filter((item) => item.id !== documentId),
  });
}

export async function getDocumentBlob(document: ProjectDocument): Promise<Blob | undefined> {
  const database = await openDatabase();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const transaction = database.transaction(BLOB_STORE, "readonly");
    const request = transaction.objectStore(BLOB_STORE).get(document.blobId);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error ?? new Error("Could not retrieve file."));
  });
  database.close();
  return blob;
}

export function setCategoryNotApplicable(
  projectId: string,
  categoryId: string,
  notApplicable: boolean,
  reason: string,
): void {
  const snapshot = readStore();
  const state: CategoryState = {
    projectId,
    categoryId,
    notApplicable,
    reason: reason.trim(),
    updatedAt: new Date().toISOString(),
  };
  writeStore({
    ...snapshot,
    categoryStates: [
      ...snapshot.categoryStates.filter(
        (item) => !(item.projectId === projectId && item.categoryId === categoryId),
      ),
      state,
    ],
  });
}

export function getCategoryProgressStatus(
  categoryId: string,
  documents: readonly ProjectDocument[],
  states: readonly CategoryState[],
): CategoryProgressStatus {
  if (states.some((state) => state.categoryId === categoryId && state.notApplicable)) {
    return "not_applicable";
  }
  const categoryDocuments = documents.filter((document) => document.categoryId === categoryId);
  if (categoryDocuments.length === 0) return "missing";
  if (categoryDocuments.some((document) => document.status === "needs_revision")) {
    return "needs_revision";
  }
  if (categoryDocuments.every((document) => document.status === "approved")) return "approved";
  if (categoryDocuments.some((document) => document.status === "needs_review")) {
    return "needs_review";
  }
  return "uploaded";
}
