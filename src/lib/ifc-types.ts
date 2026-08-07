import type { Box3, Group } from "three";

export type IfcSource = File | ArrayBuffer | Uint8Array;

export type IfcLoadStage = "initializing" | "opening" | "geometry" | "metadata" | "ready";

export type IfcLoadProgress = {
  stage: IfcLoadStage;
  completed: number;
  total: number;
  message: string;
};

export type IfcEstimatedQuantities = {
  source: "derived-geometry-bounds";
  /** Bounding-box diagonal in the model's horizontal plane. */
  lengthM: number;
  /** Smaller axis-aligned horizontal extent. */
  widthM: number;
  /** Vertical Y-axis extent in web-ifc's Three.js-ready model space. */
  heightM: number;
  /** Conservative face/plan area selected according to the IFC element type. */
  grossAreaM2: number;
  /** Equal to gross area because bounds cannot reliably resolve openings. */
  netAreaM2: number;
  /** Axis-aligned bounding-box volume, not the exact solid volume. */
  volumeM3: number;
  count: 1;
};

export type IfcElementMetadata = {
  expressID: number;
  typeCode: number;
  typeName: string;
  globalId: string | null;
  name: string | null;
  description: string | null;
  objectType: string | null;
  predefinedType: string | null;
  /**
   * Procurement-safe upper-bound estimates derived from rendered geometry.
   * Rotated, curved, hollow, and other complex elements can overestimate actual quantities.
   */
  estimatedQuantities?: IfcEstimatedQuantities;
};

export type IfcModelSummary = {
  schema: string;
  elementCount: number;
  geometryCount: number;
  triangleCount: number;
  typeCounts: Readonly<Record<string, number>>;
};

export type LoadedIfcModel = {
  group: Group;
  bounds: Box3;
  summary: IfcModelSummary;
  getElement: (expressID: number) => IfcElementMetadata | null;
  dispose: () => void;
};

export type IfcViewerStatus =
  | { state: "idle" }
  | { state: "loading"; progress: IfcLoadProgress }
  | { state: "ready"; summary: IfcModelSummary }
  | { state: "error"; message: string };
