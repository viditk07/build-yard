import { PRODUCTS, type Product } from "./catalog";

export type Subcategory = {
  id: string;
  name: string;
  note: string;
  productIds: string[];
};

export type Phase = {
  id: string;
  step: number;
  name: string;
  tagline: string;
  description: string;
  subcategories: Subcategory[];
};

export const PHASES: Phase[] = [
  {
    id: "foundation",
    step: 1,
    name: "Foundation & Earthwork",
    tagline: "Excavation to plinth",
    description:
      "Everything needed from the first dig to the plinth beam — bedding aggregates, footing concrete, reinforcement and damp proofing.",
    subcategories: [
      {
        id: "excavation-pcc",
        name: "Excavation & PCC Bed",
        note: "Soling, levelling course and lean concrete below footings.",
        productIds: ["crushed-stone", "river-sand", "ppc-cement"],
      },
      {
        id: "footing-concrete",
        name: "Footing Concrete",
        note: "Structural concrete for footings, pedestals and plinth beams.",
        productIds: ["opc-53-cement", "rmc-m25", "crushed-stone"],
      },
      {
        id: "foundation-steel",
        name: "Foundation Reinforcement",
        note: "Mats, column starter bars and binding steel.",
        productIds: ["tmt-16mm", "tmt-12mm"],
      },
      {
        id: "damp-proofing",
        name: "Damp Proofing",
        note: "Plinth-level membrane and coatings that stop rising damp.",
        productIds: ["bitumen-membrane", "waterproof-coating"],
      },
      {
        id: "site-safety",
        name: "Site Safety",
        note: "Mandatory PPE before earthwork starts.",
        productIds: ["safety-helmet"],
      },
    ],
  },
  {
    id: "structure",
    step: 2,
    name: "Civil & Structure Work",
    tagline: "Columns, slabs and walls",
    description:
      "The main civil package — RCC frame, formwork, masonry and the access equipment that goes with it.",
    subcategories: [
      {
        id: "concrete",
        name: "Concrete & Cement",
        note: "Slab, beam and column pours.",
        productIds: ["opc-53-cement", "ppc-cement", "rmc-m25"],
      },
      {
        id: "reinforcement",
        name: "Reinforcement Steel",
        note: "TMT bars and structural sections for the frame.",
        productIds: ["tmt-12mm", "tmt-16mm", "ms-angle"],
      },
      {
        id: "masonry",
        name: "Masonry & Blockwork",
        note: "Wall building with mortar sand included.",
        productIds: ["aac-block", "clay-brick", "river-sand"],
      },
      {
        id: "formwork",
        name: "Formwork & Access",
        note: "Shuttering, bracing and scaffolding for each pour.",
        productIds: ["shuttering-ply", "pine-batten", "scaffold-frame"],
      },
      {
        id: "civil-tools",
        name: "Tools",
        note: "Drilling, chipping and anchoring on the frame.",
        productIds: ["rotary-hammer"],
      },
    ],
  },
  {
    id: "plumbing",
    step: 3,
    name: "Plumbing & Sanitary",
    tagline: "Supply, drainage and fixtures",
    description:
      "Concealed water lines, waste stacks, overhead storage and the bathroom fixtures that finish the package.",
    subcategories: [
      {
        id: "water-supply",
        name: "Water Supply Lines",
        note: "Concealed hot and cold pipe runs with jointing material.",
        productIds: ["cpvc-pipe", "solvent-cement", "brass-valve"],
      },
      {
        id: "drainage",
        name: "Drainage & Waste",
        note: "Soil, waste and rainwater stacks.",
        productIds: ["upvc-swr"],
      },
      {
        id: "storage",
        name: "Storage & Distribution",
        note: "Overhead tanks and header isolation.",
        productIds: ["water-tank", "brass-valve"],
      },
      {
        id: "sanitaryware",
        name: "Sanitaryware & Fittings",
        note: "Second-fix bathroom fixtures.",
        productIds: ["wc-suite", "washbasin", "mixer-tap"],
      },
      {
        id: "wet-area",
        name: "Wet-Area Sealing",
        note: "Sunken slab and toilet waterproofing before tiling.",
        productIds: ["waterproof-coating", "rotary-hammer"],
      },
    ],
  },
  {
    id: "electrical",
    step: 4,
    name: "Electrical Work",
    tagline: "Conduiting to lighting",
    description:
      "House wiring from slab conduiting through the distribution board to switches and light points.",
    subcategories: [
      {
        id: "conduiting",
        name: "Conduiting & Chasing",
        note: "First-fix conduit laid in slabs and chased walls.",
        productIds: ["pvc-conduit", "rotary-hammer"],
      },
      {
        id: "wiring",
        name: "Wiring",
        note: "Lighting, power and appliance circuits.",
        productIds: ["fr-wire-2-5", "fr-wire-4"],
      },
      {
        id: "distribution",
        name: "Distribution & Protection",
        note: "Boards, MCBs and earth-leakage protection.",
        productIds: ["distribution-board"],
      },
      {
        id: "accessories",
        name: "Switches & Sockets",
        note: "Modular second-fix accessories, room by room.",
        productIds: ["modular-switch-set"],
      },
      {
        id: "lighting",
        name: "Lighting",
        note: "Ceiling and cove light fittings.",
        productIds: ["led-panel"],
      },
    ],
  },
  {
    id: "flooring",
    step: 5,
    name: "Flooring & Tiling",
    tagline: "Floors, dados and counters",
    description:
      "Floor and wall finishes with the screed, adhesives and grout needed to lay them properly.",
    subcategories: [
      {
        id: "floor-tiles",
        name: "Floor Tiles & Planks",
        note: "Living, bedroom and passage flooring.",
        productIds: ["vitrified-tile", "laminate-floor"],
      },
      {
        id: "wall-tiles",
        name: "Wall Tiles & Dado",
        note: "Bathroom and kitchen dado.",
        productIds: ["wall-tile"],
      },
      {
        id: "natural-stone",
        name: "Natural Stone",
        note: "Counters, treads and sills.",
        productIds: ["granite-slab"],
      },
      {
        id: "laying-chemicals",
        name: "Screed, Adhesive & Grout",
        note: "Bedding mortar and jointing consumables.",
        productIds: ["tile-adhesive", "epoxy-grout", "ppc-cement", "river-sand"],
      },
    ],
  },
  {
    id: "painting",
    step: 6,
    name: "Plaster, Putty & Paint",
    tagline: "Surface prep to final coat",
    description:
      "Plaster base, putty and primer prep, then interior, exterior and trim coats with weather protection.",
    subcategories: [
      {
        id: "plaster",
        name: "Plaster Base",
        note: "Internal and external wall plaster.",
        productIds: ["ppc-cement", "river-sand"],
      },
      {
        id: "surface-prep",
        name: "Putty & Primer",
        note: "Levelling and sealing before topcoats.",
        productIds: ["wall-putty", "wall-primer"],
      },
      {
        id: "interior-paint",
        name: "Interior Paint",
        note: "Washable emulsion for internal walls and ceilings.",
        productIds: ["interior-emulsion"],
      },
      {
        id: "exterior-paint",
        name: "Exterior Paint",
        note: "Weatherproof facade and compound-wall coats.",
        productIds: ["exterior-emulsion"],
      },
      {
        id: "trim-paint",
        name: "Trim, Grills & Doors",
        note: "Enamel finishes on metal and wood.",
        productIds: ["enamel-paint"],
      },
      {
        id: "terrace-waterproofing",
        name: "Terrace Waterproofing",
        note: "Elastomeric coating before handover.",
        productIds: ["waterproof-coating"],
      },
    ],
  },
  {
    id: "interiors",
    step: 7,
    name: "Interiors & Fit-Out",
    tagline: "Doors, ceilings and joinery",
    description:
      "The finishing package — shutters and windows, false ceilings, wardrobes and hardware.",
    subcategories: [
      {
        id: "doors-windows",
        name: "Doors & Windows",
        note: "Shutters, frames and glazing.",
        productIds: ["flush-door", "upvc-window", "door-hardware"],
      },
      {
        id: "false-ceiling",
        name: "False Ceiling",
        note: "Board, grid and recessed lighting.",
        productIds: ["gypsum-board", "gi-ceiling-channel", "led-panel"],
      },
      {
        id: "joinery",
        name: "Joinery & Woodwork",
        note: "Wardrobes, kitchen carcasses and panelling.",
        productIds: ["prelam-mdf", "marine-ply", "pine-batten"],
      },
      {
        id: "modular-kitchen",
        name: "Modular Kitchen",
        note: "Base units, drawers, counters and handle profiles.",
        productIds: [
          "modular-kitchen-base",
          "kitchen-tandem-drawer",
          "quartz-countertop",
          "modular-wardrobe-handles",
        ],
      },
      {
        id: "wardrobes-storage",
        name: "Wardrobes & Storage",
        note: "Sliding shutters, loft units and internal accessories.",
        productIds: [
          "wardrobe-sliding",
          "wardrobe-loft-shutter",
          "wardrobe-internals",
          "prelam-mdf",
        ],
      },
      {
        id: "wall-ceiling-decor",
        name: "Wall & Ceiling Decor",
        note: "Panelling, cornices and engineered wood flooring.",
        productIds: ["wpc-wall-panel", "pop-cornice", "engineered-wood-floor"],
      },
      {
        id: "lighting-soft-furnishing",
        name: "Lighting & Soft Furnishing",
        note: "Decorative lighting, mirrors and window blinds.",
        productIds: [
          "cove-lighting-profile",
          "decor-pendant-light",
          "wall-mirror-led",
          "roller-blinds",
        ],
      },
      {
        id: "fit-out-tools",
        name: "Hardware & Tools",
        note: "Fixing hardware and installation tools.",
        productIds: ["door-hardware", "rotary-hammer"],
      },
    ],
  },
];

export const getPhase = (id: string) => PHASES.find((p) => p.id === id);

export const phaseProducts = (phase: Phase): Product[] => {
  const ids = new Set(phase.subcategories.flatMap((s) => s.productIds));
  return PRODUCTS.filter((p) => ids.has(p.id));
};

export const subcategoryProducts = (sub: Subcategory): Product[] =>
  sub.productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

export const phaseSupplierIds = (phase: Phase): string[] =>
  Array.from(new Set(phaseProducts(phase).map((p) => p.supplierId)));

export const phasesForProduct = (productId: string) =>
  PHASES.filter((phase) =>
    phase.subcategories.some((s) => s.productIds.includes(productId)),
  );
