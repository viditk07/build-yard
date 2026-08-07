import { PRODUCTS, SUPPLIERS, type Product, type Supplier } from "./catalog";
import type {
  ElementTakeoff,
  MaterialRequirement,
  ModelElementSnapshot,
  SupplierMatch,
  TakeoffConfidence,
} from "./takeoff-types";

type QuantityBasis = "lengthM" | "netAreaM2" | "volumeM3" | "count";

type RecipeLine = {
  genericName: string;
  specification: string;
  productId: string;
  basis: QuantityBasis;
  factor: number;
  wastePercent: number;
  factorDescription: string;
  assumption?: string;
  confidencePenalty?: number;
};

type TakeoffRecipe = {
  id: string;
  version: "1.0.0";
  appliesTo: readonly string[];
  materialIncludes?: readonly string[];
  predefinedTypeIncludes?: readonly string[];
  lines: readonly RecipeLine[];
};

const SQ_M_TO_SQ_FT = 10.7639;

/**
 * MVP recipes are intentionally explicit and conservative. They are estimation
 * defaults, not a substitute for an approved BOQ or structural schedule.
 */
export const TAKEOFF_RECIPES: readonly TakeoffRecipe[] = [
  {
    id: "aac-wall-150mm",
    version: "1.0.0",
    appliesTo: ["IFCWALL", "IFCWALLSTANDARDCASE"],
    materialIncludes: ["AAC", "BLOCK"],
    lines: [
      {
        genericName: "AAC masonry blocks",
        specification: "600 × 200 × 150 mm, Grade 1",
        productId: "aac-block",
        basis: "netAreaM2",
        factor: 8.3334,
        wastePercent: 5,
        factorDescription: "8.333 blocks per m² of net wall face",
      },
      {
        genericName: "Masonry cement",
        specification: "PPC blended cement, 50 kg",
        productId: "ppc-cement",
        basis: "netAreaM2",
        factor: 0.085,
        wastePercent: 7,
        factorDescription: "0.085 bags per m² for thin-bed mortar and wastage",
        assumption: "Mortar demand is a preliminary AAC wall allowance.",
        confidencePenalty: 10,
      },
    ],
  },
  {
    id: "clay-brick-wall-230mm",
    version: "1.0.0",
    appliesTo: ["IFCWALL", "IFCWALLSTANDARDCASE"],
    materialIncludes: ["BRICK", "CLAY"],
    lines: [
      {
        genericName: "First-class clay bricks",
        specification: "230 × 110 × 75 mm, Class A",
        productId: "clay-brick",
        basis: "netAreaM2",
        factor: 50,
        wastePercent: 7,
        factorDescription: "50 bricks per m² of nominal half-brick wall",
        assumption: "Wall thickness is assumed to be 110–115 mm.",
        confidencePenalty: 10,
      },
      {
        genericName: "Masonry cement",
        specification: "PPC blended cement, 50 kg",
        productId: "ppc-cement",
        basis: "netAreaM2",
        factor: 0.16,
        wastePercent: 7,
        factorDescription: "0.16 bags per m² of nominal half-brick wall",
        assumption: "Mortar mix and joint thickness must be confirmed by the QS.",
        confidencePenalty: 15,
      },
      {
        genericName: "Fine aggregate for mortar",
        specification: "Washed river sand, Zone II",
        productId: "river-sand",
        basis: "netAreaM2",
        factor: 0.012,
        wastePercent: 7,
        factorDescription: "0.012 tonnes per m² of nominal half-brick wall",
        assumption: "Mortar mix and joint thickness must be confirmed by the QS.",
        confidencePenalty: 15,
      },
    ],
  },
  {
    id: "generic-masonry-wall",
    version: "1.0.0",
    appliesTo: ["IFCWALL", "IFCWALLSTANDARDCASE"],
    lines: [
      {
        genericName: "AAC masonry blocks",
        specification: "600 × 200 × 150 mm, Grade 1",
        productId: "aac-block",
        basis: "netAreaM2",
        factor: 8.3334,
        wastePercent: 5,
        factorDescription: "8.333 blocks per m² of net wall face",
        assumption: "AAC 150 mm wall assembly assumed because the IFC material is missing.",
        confidencePenalty: 25,
      },
    ],
  },
  {
    id: "reinforced-concrete-slab",
    version: "1.0.0",
    appliesTo: ["IFCSLAB"],
    lines: [
      {
        genericName: "Structural concrete",
        specification: "Ready-mix concrete M25",
        productId: "rmc-m25",
        basis: "volumeM3",
        factor: 1,
        wastePercent: 3,
        factorDescription: "IFC net volume",
      },
      {
        genericName: "Reinforcement steel",
        specification: "Fe500D TMT, 12 mm equivalent",
        productId: "tmt-12mm",
        basis: "volumeM3",
        factor: 90,
        wastePercent: 3,
        factorDescription: "90 kg per m³ preliminary slab allowance",
        assumption: "Replace with reinforcement schedule weight before procurement.",
        confidencePenalty: 30,
      },
    ],
  },
  {
    id: "reinforced-concrete-beam",
    version: "1.0.0",
    appliesTo: ["IFCBEAM"],
    lines: [
      {
        genericName: "Structural concrete",
        specification: "Ready-mix concrete M25",
        productId: "rmc-m25",
        basis: "volumeM3",
        factor: 1,
        wastePercent: 3,
        factorDescription: "IFC net volume",
      },
      {
        genericName: "Reinforcement steel",
        specification: "Fe500D TMT, 12 mm equivalent",
        productId: "tmt-12mm",
        basis: "volumeM3",
        factor: 130,
        wastePercent: 3,
        factorDescription: "130 kg per m³ preliminary beam allowance",
        assumption: "Replace with reinforcement schedule weight before procurement.",
        confidencePenalty: 30,
      },
    ],
  },
  {
    id: "reinforced-concrete-column-footing",
    version: "1.0.0",
    appliesTo: ["IFCCOLUMN", "IFCFOOTING"],
    lines: [
      {
        genericName: "Structural concrete",
        specification: "Ready-mix concrete M25",
        productId: "rmc-m25",
        basis: "volumeM3",
        factor: 1,
        wastePercent: 3,
        factorDescription: "IFC net volume",
      },
      {
        genericName: "Reinforcement steel",
        specification: "Fe550D TMT, 16 mm equivalent",
        productId: "tmt-16mm",
        basis: "volumeM3",
        factor: 160,
        wastePercent: 3,
        factorDescription: "160 kg per m³ preliminary column/footing allowance",
        assumption: "Replace with reinforcement schedule weight before procurement.",
        confidencePenalty: 30,
      },
    ],
  },
  {
    id: "flat-roof-waterproofing",
    version: "1.0.0",
    appliesTo: ["IFCROOF"],
    lines: [
      {
        genericName: "Elastomeric waterproof coating",
        specification: "Acrylic waterproof coating, two coats",
        productId: "waterproof-coating",
        basis: "netAreaM2",
        factor: 1 / 30.2,
        wastePercent: 10,
        factorDescription: "one 20 kg bucket per 30.2 m²",
        assumption: "Flat/low-slope roof and two-coat system assumed.",
        confidencePenalty: 15,
      },
    ],
  },
  {
    id: "door-set",
    version: "1.0.0",
    appliesTo: ["IFCDOOR"],
    lines: [
      {
        genericName: "Solid-core door shutter",
        specification: "32 mm BWP flush door",
        productId: "flush-door",
        basis: "count",
        factor: 1,
        wastePercent: 0,
        factorDescription: "one shutter per IFC door",
      },
      {
        genericName: "Door hardware set",
        specification: "Stainless-steel residential hardware set",
        productId: "door-hardware",
        basis: "count",
        factor: 1,
        wastePercent: 0,
        factorDescription: "one hardware set per IFC door",
      },
    ],
  },
  {
    id: "window-set",
    version: "1.0.0",
    appliesTo: ["IFCWINDOW"],
    lines: [
      {
        genericName: "UPVC glazed window",
        specification: "Lead-free two-track UPVC with 5 mm glazing",
        productId: "upvc-window",
        basis: "netAreaM2",
        factor: SQ_M_TO_SQ_FT,
        wastePercent: 0,
        factorDescription: "IFC opening area converted from m² to sq ft",
      },
    ],
  },
  {
    id: "water-supply-pipe",
    version: "1.0.0",
    appliesTo: ["IFCPIPESEGMENT"],
    predefinedTypeIncludes: ["SUPPLY", "WATER", "CPVC"],
    lines: [
      {
        genericName: "CPVC water-supply pipe",
        specification: "25 mm SDR 11, 3 m length",
        productId: "cpvc-pipe",
        basis: "lengthM",
        factor: 1 / 3,
        wastePercent: 8,
        factorDescription: "IFC run length divided by 3 m stock length",
      },
      {
        genericName: "CPVC solvent cement",
        specification: "ASTM F493, 500 ml",
        productId: "solvent-cement",
        basis: "lengthM",
        factor: 1 / 120,
        wastePercent: 10,
        factorDescription: "one tin per 120 m preliminary pipe allowance",
        assumption: "Fitting and joint count is unavailable; verify against plumbing schedule.",
        confidencePenalty: 20,
      },
    ],
  },
  {
    id: "drain-pipe",
    version: "1.0.0",
    appliesTo: ["IFCPIPESEGMENT"],
    predefinedTypeIncludes: ["DRAIN", "WASTE", "SOIL", "SWR", "UPVC"],
    lines: [
      {
        genericName: "UPVC soil/waste pipe",
        specification: "110 mm Type B, 3 m length",
        productId: "upvc-swr",
        basis: "lengthM",
        factor: 1 / 3,
        wastePercent: 8,
        factorDescription: "IFC run length divided by 3 m stock length",
      },
    ],
  },
  {
    id: "electrical-conduit",
    version: "1.0.0",
    appliesTo: ["IFCCABLECARRIERSEGMENT", "IFCCABLESEGMENT"],
    lines: [
      {
        genericName: "Concealed PVC conduit",
        specification: "25 mm medium-duty, 3 m length",
        productId: "pvc-conduit",
        basis: "lengthM",
        factor: 1 / 3,
        wastePercent: 10,
        factorDescription: "IFC run length divided by 3 m stock length",
      },
      {
        genericName: "FR PVC house wire",
        specification: "2.5 sq mm, 90 m coil",
        productId: "fr-wire-2-5",
        basis: "lengthM",
        factor: 3 / 90,
        wastePercent: 10,
        factorDescription: "three conductors over IFC run length, divided by 90 m coil",
        assumption: "Single-phase line, neutral and earth assumed; circuit schedule governs.",
        confidencePenalty: 20,
      },
    ],
  },
  {
    id: "sanitary-fixture",
    version: "1.0.0",
    appliesTo: ["IFCSANITARYTERMINAL", "IFCFLOWTERMINAL"],
    predefinedTypeIncludes: ["WC", "TOILET", "WATER CLOSET"],
    lines: [
      {
        genericName: "WC suite",
        specification: "Wall-hung WC with concealed cistern",
        productId: "wc-suite",
        basis: "count",
        factor: 1,
        wastePercent: 0,
        factorDescription: "one suite per IFC sanitary terminal",
      },
    ],
  },
  {
    id: "light-fixture",
    version: "1.0.0",
    appliesTo: ["IFCLIGHTFIXTURE", "IFCELECTRICAPPLIANCE"],
    predefinedTypeIncludes: ["LIGHT", "LAMP", "PANEL"],
    lines: [
      {
        genericName: "LED recessed panel light",
        specification: "15 W neutral-white panel",
        productId: "led-panel",
        basis: "count",
        factor: 0.1,
        wastePercent: 0,
        factorDescription: "ten fixtures per catalog pack",
      },
    ],
  },
  {
    id: "distribution-board",
    version: "1.0.0",
    appliesTo: ["IFCDISTRIBUTIONBOARD"],
    lines: [
      {
        genericName: "Residential distribution board",
        specification: "8-way SPN with RCCB and MCBs",
        productId: "distribution-board",
        basis: "count",
        factor: 1,
        wastePercent: 0,
        factorDescription: "one board per IFC distribution board",
      },
    ],
  },
] as const;

const positive = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

const normalized = (value: string | undefined) => value?.trim().toUpperCase() ?? "";

function resolveBasis(
  element: ModelElementSnapshot,
  basis: QuantityBasis,
): { value: number | undefined; source: string; fallback: boolean } {
  const quantities = element.quantities;
  if (basis === "count") {
    return {
      value: positive(quantities.count) ?? 1,
      source: positive(quantities.count) ? "IFC count" : "one selected element",
      fallback: !positive(quantities.count),
    };
  }
  if (basis === "lengthM") {
    return { value: positive(quantities.lengthM), source: "IFC length", fallback: false };
  }
  if (basis === "volumeM3") {
    const direct = positive(quantities.volumeM3);
    if (direct) return { value: direct, source: "IFC net volume", fallback: false };
    const length = positive(quantities.lengthM);
    const width = positive(quantities.widthM);
    const height = positive(quantities.heightM);
    return {
      value: length && width && height ? length * width * height : undefined,
      source: "derived length × width × height",
      fallback: true,
    };
  }
  const direct = positive(quantities.netAreaM2);
  if (direct) return { value: direct, source: "IFC net area", fallback: false };
  const gross = positive(quantities.grossAreaM2);
  if (gross) return { value: gross, source: "IFC gross area", fallback: true };
  const length = positive(quantities.lengthM);
  const height = positive(quantities.heightM);
  const width = positive(quantities.widthM);
  return {
    value: length && height ? length * height : length && width ? length * width : undefined,
    source: length && height ? "derived length × height" : "derived length × width",
    fallback: true,
  };
}

function recipeSpecificity(recipe: TakeoffRecipe): number {
  return (recipe.materialIncludes?.length ?? 0) + (recipe.predefinedTypeIncludes?.length ?? 0);
}

export function findTakeoffRecipe(element: ModelElementSnapshot): TakeoffRecipe | undefined {
  const ifcClass = normalized(element.ifcClass);
  const searchable = normalized(
    `${element.material ?? ""} ${element.predefinedType ?? ""} ${element.name}`,
  );
  return TAKEOFF_RECIPES.filter((recipe) => recipe.appliesTo.includes(ifcClass))
    .filter(
      (recipe) =>
        (!recipe.materialIncludes ||
          recipe.materialIncludes.some((term) => searchable.includes(term))) &&
        (!recipe.predefinedTypeIncludes ||
          recipe.predefinedTypeIncludes.some((term) => searchable.includes(term))),
    )
    .sort((a, b) => recipeSpecificity(b) - recipeSpecificity(a))[0];
}

function confidenceFor(
  element: ModelElementSnapshot,
  fallback: boolean,
  penalty = 0,
): { confidence: TakeoffConfidence; score: number } {
  let score = element.quantitySource === "ifc-base-quantity" ? 95 : 82;
  if (element.quantitySource === "derived-from-geometry") score = 72;
  if (element.quantitySource === "recipe-default" || !element.quantitySource) score = 65;
  if (fallback) score -= 15;
  if (!element.approved) score -= 10;
  score = Math.max(20, score - penalty);
  return {
    score,
    confidence: score >= 80 ? "high" : score >= 55 ? "medium" : "low",
  };
}

function buildRequirement(
  element: ModelElementSnapshot,
  recipe: TakeoffRecipe,
  line: RecipeLine,
  index: number,
): MaterialRequirement | undefined {
  const basis = resolveBasis(element, line.basis);
  if (!basis.value) return undefined;
  const product = PRODUCTS.find((candidate) => candidate.id === line.productId);
  if (!product) return undefined;

  const baseQuantity = basis.value * line.factor;
  const requiredQuantity = baseQuantity * (1 + line.wastePercent / 100);
  const orderQuantity = Math.ceil(requiredQuantity / product.moq) * product.moq;
  const confidence = confidenceFor(element, basis.fallback, line.confidencePenalty);

  return {
    id: `${element.globalId}:${recipe.id}:${index}`,
    genericName: line.genericName,
    specification: line.specification,
    productId: product.id,
    baseQuantity,
    wastePercent: line.wastePercent,
    requiredQuantity,
    orderQuantity,
    unit: product.unit,
    formula: `${basis.value.toFixed(2)} (${basis.source}) × ${line.factor.toFixed(4)} (${line.factorDescription}) + ${line.wastePercent}% waste`,
    assumptions: line.assumption ? [line.assumption] : [],
    confidence: confidence.confidence,
    confidenceScore: confidence.score,
  };
}

function buildSupplierMatch(requirement: MaterialRequirement): SupplierMatch | undefined {
  const product = PRODUCTS.find((candidate) => candidate.id === requirement.productId);
  if (!product) return undefined;
  return {
    productId: product.id,
    supplierId: product.supplierId,
    orderQuantity: requirement.orderQuantity,
    estimatedSubtotal: requirement.orderQuantity * product.price,
    stockStatus:
      product.stock <= 0
        ? "on-request"
        : product.stock >= requirement.orderQuantity
          ? "available"
          : "partial",
    compatibility: "exact-catalog-match",
  };
}

export function calculateElementTakeoff(
  element: ModelElementSnapshot,
  now = new Date(),
): ElementTakeoff {
  const recipe = findTakeoffRecipe(element);
  if (!recipe) {
    return {
      element,
      generatedAt: now.toISOString(),
      requirements: [],
      supplierMatches: [],
      warnings: [
        `No approved MVP material recipe exists for ${element.ifcClass}. Add or classify an assembly before procurement.`,
      ],
      procurementReady: false,
    };
  }

  const requirements = recipe.lines
    .map((line, index) => buildRequirement(element, recipe, line, index))
    .filter((item): item is MaterialRequirement => Boolean(item));
  const missingLines = recipe.lines.length - requirements.length;
  const supplierMatches = requirements
    .map(buildSupplierMatch)
    .filter((item): item is SupplierMatch => Boolean(item));
  const warnings: string[] = [];
  if (!element.approved) warnings.push("This model element has not been approved.");
  if (missingLines > 0) {
    warnings.push(
      `${missingLines} recipe line(s) could not be calculated from available quantities.`,
    );
  }
  if (requirements.some((item) => item.confidence === "low")) {
    warnings.push("Low-confidence allowances must be reviewed against drawings or schedules.");
  }
  if (supplierMatches.some((match) => match.stockStatus !== "available")) {
    warnings.push("One or more catalog matches require stock confirmation.");
  }

  const procurementReady =
    Boolean(element.approved) &&
    missingLines === 0 &&
    requirements.length > 0 &&
    requirements.every((item) => item.confidence !== "low") &&
    supplierMatches.every((match) => match.stockStatus === "available");

  return {
    element,
    recipeId: recipe.id,
    recipeVersion: recipe.version,
    generatedAt: now.toISOString(),
    requirements,
    supplierMatches,
    warnings,
    procurementReady,
  };
}

export function getMatchedOffer(
  requirement: MaterialRequirement,
): { product: Product; supplier: Supplier; match: SupplierMatch } | undefined {
  const product = PRODUCTS.find((candidate) => candidate.id === requirement.productId);
  if (!product) return undefined;
  const supplier = SUPPLIERS.find((candidate) => candidate.id === product.supplierId);
  const match = buildSupplierMatch(requirement);
  return supplier && match ? { product, supplier, match } : undefined;
}

export function mergeTakeoffs(takeoffs: readonly ElementTakeoff[]): MaterialRequirement[] {
  const groups = new Map<string, MaterialRequirement[]>();
  for (const requirement of takeoffs.flatMap((takeoff) => takeoff.requirements)) {
    const current = groups.get(requirement.productId) ?? [];
    current.push(requirement);
    groups.set(requirement.productId, current);
  }

  return Array.from(groups.entries()).map(([productId, requirements]) => {
    const product = PRODUCTS.find((candidate) => candidate.id === productId);
    const first = requirements[0];
    if (!first || !product) throw new Error(`Catalog product ${productId} is missing`);
    const baseQuantity = requirements.reduce((sum, item) => sum + item.baseQuantity, 0);
    const requiredQuantity = requirements.reduce((sum, item) => sum + item.requiredQuantity, 0);
    return {
      ...first,
      id: `merged:${productId}`,
      baseQuantity,
      requiredQuantity,
      orderQuantity: Math.ceil(requiredQuantity / product.moq) * product.moq,
      formula: `Sum of ${requirements.length} element takeoff line(s), rounded to catalog MOQ`,
      assumptions: Array.from(new Set(requirements.flatMap((item) => item.assumptions))),
      confidenceScore: Math.min(...requirements.map((item) => item.confidenceScore)),
      confidence: requirements.some((item) => item.confidence === "low")
        ? "low"
        : requirements.some((item) => item.confidence === "medium")
          ? "medium"
          : "high",
    };
  });
}
