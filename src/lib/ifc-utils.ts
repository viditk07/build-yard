import type { IfcElementMetadata, IfcEstimatedQuantities } from "./ifc-types";

type IfcWrappedValue = {
  value?: unknown;
};

export type IfcLineLike = Record<string, unknown> & {
  expressID?: number;
  type?: number;
};

export type IfcGeometryBoundsSize = {
  x: number;
  y: number;
  z: number;
};

function isWrappedValue(value: unknown): value is IfcWrappedValue {
  return typeof value === "object" && value !== null && "value" in value;
}

/** Returns the primitive value inside web-ifc's `{ value, type }` wrappers. */
export function unwrapIfcValue(value: unknown): unknown {
  let current = value;
  const seen = new Set<object>();

  while (isWrappedValue(current)) {
    if (seen.has(current)) return null;
    seen.add(current);
    current = current.value;
  }

  return current;
}

/** Normalizes IFC text values without leaking `undefined` into UI state. */
export function getIfcText(value: unknown): string | null {
  const unwrapped = unwrapIfcValue(value);
  if (typeof unwrapped !== "string") return null;
  const normalized = unwrapped.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getIfcInteger(value: unknown): number | null {
  const unwrapped = unwrapIfcValue(value);
  return typeof unwrapped === "number" && Number.isInteger(unwrapped) ? unwrapped : null;
}

export function elementMetadataFromLine(
  line: IfcLineLike,
  fallbackExpressID: number,
  typeNameForCode: (typeCode: number) => string,
): IfcElementMetadata {
  const expressID = getIfcInteger(line.expressID) ?? fallbackExpressID;
  const typeCode = getIfcInteger(line.type) ?? 0;

  return {
    expressID,
    typeCode,
    typeName: typeNameForCode(typeCode) || "IFCUNKNOWN",
    globalId: getIfcText(line["GlobalId"]),
    name: getIfcText(line["Name"]),
    description: getIfcText(line["Description"]),
    objectType: getIfcText(line["ObjectType"]),
    predefinedType: getIfcText(line["PredefinedType"]),
  };
}

function normalizedExtent(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundedQuantity(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Produces deliberately conservative takeoff hints from an accumulated,
 * axis-aligned IFC geometry bound. The bounds are already transformed into
 * model space, so rotated and complex elements generally overestimate actual
 * dimensions. Exact IFC quantity sets should supersede these estimates later.
 */
export function estimateIfcQuantitiesFromBounds(
  size: IfcGeometryBoundsSize,
  typeName: string,
): IfcEstimatedQuantities {
  const x = normalizedExtent(size.x);
  const y = normalizedExtent(size.y);
  const z = normalizedExtent(size.z);
  // web-ifc emits Three.js-ready Y-up geometry, so X/Z form the plan and Y is height.
  const horizontalDiagonal = Math.hypot(x, z);
  const planArea = x * z;
  const verticalEnvelopeArea = horizontalDiagonal * y;
  const normalizedType = typeName.toUpperCase();

  let grossArea = Math.max(planArea, x * z, y * z);
  if (normalizedType.startsWith("IFCWALL")) grossArea = verticalEnvelopeArea;
  if (
    normalizedType.startsWith("IFCSLAB") ||
    normalizedType.startsWith("IFCROOF") ||
    normalizedType.startsWith("IFCFOOTING")
  ) {
    grossArea = planArea;
  }

  return {
    source: "derived-geometry-bounds",
    lengthM: roundedQuantity(horizontalDiagonal),
    widthM: roundedQuantity(Math.min(x, z)),
    heightM: roundedQuantity(y),
    grossAreaM2: roundedQuantity(grossArea),
    netAreaM2: roundedQuantity(grossArea),
    volumeM3: roundedQuantity(x * y * z),
    count: 1,
  };
}

export function isIfcFilename(filename: string): boolean {
  return filename.trim().toLowerCase().endsWith(".ifc");
}

export function formatIfcTypeName(typeName: string): string {
  const withoutPrefix = typeName.replace(/^IFC/i, "");
  return withoutPrefix
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
