export const IFC_ELEMENT_CLASSES = [
  "IfcWall",
  "IfcWallStandardCase",
  "IfcSlab",
  "IfcBeam",
  "IfcColumn",
  "IfcFooting",
  "IfcRoof",
  "IfcDoor",
  "IfcWindow",
  "IfcPipeSegment",
  "IfcFlowTerminal",
  "IfcSanitaryTerminal",
  "IfcElectricAppliance",
  "IfcCableCarrierSegment",
  "IfcCableSegment",
  "IfcLightFixture",
  "IfcDistributionBoard",
] as const;

export type IfcElementClass = (typeof IFC_ELEMENT_CLASSES)[number];

export type QuantitySource =
  "ifc-base-quantity" | "ifc-property-set" | "derived-from-geometry" | "recipe-default";

export type ElementQuantities = {
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  grossAreaM2?: number;
  netAreaM2?: number;
  volumeM3?: number;
  count?: number;
  reinforcementKg?: number;
};

/** A renderer-independent snapshot of one selected semantic model element. */
export type ModelElementSnapshot = {
  globalId: string;
  ifcClass: IfcElementClass | string;
  name: string;
  predefinedType?: string;
  material?: string;
  storey?: string;
  space?: string;
  modelRevision?: string;
  quantities: ElementQuantities;
  quantitySource?: QuantitySource;
  approved?: boolean;
};

export type TakeoffConfidence = "high" | "medium" | "low";

export type MaterialRequirement = {
  id: string;
  genericName: string;
  specification: string;
  productId: string;
  baseQuantity: number;
  wastePercent: number;
  requiredQuantity: number;
  orderQuantity: number;
  unit: string;
  formula: string;
  assumptions: string[];
  confidence: TakeoffConfidence;
  confidenceScore: number;
};

export type SupplierMatch = {
  productId: string;
  supplierId: string;
  orderQuantity: number;
  estimatedSubtotal: number;
  stockStatus: "available" | "partial" | "on-request";
  compatibility: "exact-catalog-match";
};

export type ElementTakeoff = {
  element: ModelElementSnapshot;
  recipeId?: string;
  recipeVersion?: string;
  generatedAt: string;
  requirements: MaterialRequirement[];
  supplierMatches: SupplierMatch[];
  warnings: string[];
  procurementReady: boolean;
};
