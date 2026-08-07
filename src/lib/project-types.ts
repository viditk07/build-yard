export type UnitSystem = "metric" | "imperial";

export type DrawingStatus = "uploaded" | "needs_review" | "needs_revision" | "approved";

export type Project = {
  id: string;
  name: string;
  address: string;
  pinCode: string;
  buildingType: string;
  floorCount: number;
  builtUpArea: number;
  unitSystem: UnitSystem;
  constructionMethod: string;
  targetStartDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

export type DrawingCategory = {
  id: string;
  discipline: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFiles: string;
  examples: readonly string[];
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  categoryId: string;
  title: string;
  drawingNumber: string;
  revision: string;
  version: number;
  drawingDate: string;
  floor: string;
  author: string;
  notes: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blobId: string;
  status: DrawingStatus;
  uploadedAt: string;
  updatedAt: string;
};

export type DrawingUploadMetadata = {
  title: string;
  drawingNumber: string;
  revision: string;
  drawingDate: string;
  floor: string;
  author: string;
  notes: string;
};

export type CategoryState = {
  projectId: string;
  categoryId: string;
  notApplicable: boolean;
  reason: string;
  updatedAt: string;
};

export type CategoryProgressStatus =
  "missing" | "uploaded" | "needs_review" | "needs_revision" | "approved" | "not_applicable";

export const DRAWING_CATEGORIES: readonly DrawingCategory[] = [
  {
    id: "site",
    discipline: "Project & site",
    name: "Site and survey",
    description: "Site plan, survey, soil report, plot boundaries and utility connections.",
    required: true,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Site plan", "Topographic survey", "Soil report"],
  },
  {
    id: "architectural",
    discipline: "Architectural",
    name: "Architectural drawings",
    description: "Plans, elevations, sections, schedules and room layouts.",
    required: true,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Floor plans", "Elevations", "Door & window schedule"],
  },
  {
    id: "structural",
    discipline: "Structural",
    name: "Structural drawings",
    description: "Foundations, columns, beams, slabs, stairs and reinforcement schedules.",
    required: true,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Foundation plan", "Beam layout", "Bar bending schedule"],
  },
  {
    id: "plumbing",
    discipline: "MEP",
    name: "Plumbing drawings",
    description: "Water supply, sanitary drainage, rainwater, fixtures and risers.",
    required: true,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Water supply", "Drainage plan", "Riser diagram"],
  },
  {
    id: "electrical",
    discipline: "MEP",
    name: "Electrical drawings",
    description: "Lighting, sockets, conduits, single-line diagrams, DB schedules and earthing.",
    required: true,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Lighting plan", "Power plan", "Single-line diagram"],
  },
  {
    id: "hvac",
    discipline: "MEP",
    name: "HVAC and ventilation",
    description: "Equipment, ducting, exhaust, ventilation and service routes.",
    required: false,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["HVAC layout", "Ventilation plan"],
  },
  {
    id: "fire-safety",
    discipline: "Life safety",
    name: "Fire and life safety",
    description: "Detection, alarm, extinguishing and evacuation drawings where applicable.",
    required: false,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Fire alarm plan", "Evacuation plan"],
  },
  {
    id: "interiors",
    discipline: "Interiors",
    name: "Interiors and finishes",
    description: "Ceilings, flooring, joinery, kitchens and finish schedules.",
    required: false,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["Reflected ceiling", "Floor finish plan", "Joinery details"],
  },
  {
    id: "external-works",
    discipline: "External works",
    name: "External works",
    description: "Drainage, compound walls, paving, landscaping, gates and utilities.",
    required: false,
    acceptedFiles: ".pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg",
    examples: ["External drainage", "Landscape plan"],
  },
  {
    id: "specifications",
    discipline: "Specifications",
    name: "Specifications and schedules",
    description: "Material specifications, BOQ, finish schedules and consultant notes.",
    required: true,
    acceptedFiles: ".pdf,.xlsx,.xls,.csv,.doc,.docx",
    examples: ["BOQ", "Material specification", "Finish schedule"],
  },
  {
    id: "ifc-model",
    discipline: "BIM & coordination",
    name: "IFC building model",
    description: "The approved semantic IFC model used for model review and quantity takeoff.",
    required: true,
    acceptedFiles: ".ifc",
    examples: ["Coordination model (.ifc)"],
  },
] as const;

export function drawingStatusLabel(status: DrawingStatus): string {
  const labels: Record<DrawingStatus, string> = {
    uploaded: "Uploaded",
    needs_review: "Needs review",
    needs_revision: "Needs revision",
    approved: "Approved",
  };
  return labels[status];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
