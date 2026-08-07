import { PHASES } from "./phases";

export type WorkPackageStatus =
  "blocked" | "ready" | "in-progress" | "awaiting-approval" | "complete";

export type SopReadiness = {
  drawingsApproved: boolean;
  modelApproved: boolean;
  takeoffApproved: boolean;
  materialsConfirmed: boolean;
};

export type WorkPackage = {
  id: string;
  sequence: number;
  name: string;
  summary: string;
  sourcePhaseId?: string;
  dependencies: string[];
  requiredDisciplines: string[];
  modelElementClasses: string[];
  materialProductIds: string[];
  holdPoints: string[];
};

export type ProjectWorkPackage = WorkPackage & {
  status: WorkPackageStatus;
  completionPercent: number;
  blockers: string[];
};

const PHASE_META: Record<
  string,
  Pick<WorkPackage, "requiredDisciplines" | "modelElementClasses" | "holdPoints">
> = {
  foundation: {
    requiredDisciplines: ["architectural", "structural", "site"],
    modelElementClasses: ["IfcFooting", "IfcColumn"],
    holdPoints: ["Founding level approved", "Reinforcement inspected before pour"],
  },
  structure: {
    requiredDisciplines: ["architectural", "structural"],
    modelElementClasses: ["IfcColumn", "IfcBeam", "IfcSlab", "IfcWall"],
    holdPoints: ["Formwork and reinforcement approved", "Concrete test records captured"],
  },
  plumbing: {
    requiredDisciplines: ["plumbing", "architectural"],
    modelElementClasses: ["IfcPipeSegment", "IfcSanitaryTerminal"],
    holdPoints: ["Concealed pipework pressure-tested", "Drainage falls inspected"],
  },
  electrical: {
    requiredDisciplines: ["electrical", "architectural"],
    modelElementClasses: ["IfcCableCarrierSegment", "IfcCableSegment", "IfcDistributionBoard"],
    holdPoints: ["Conduit routes inspected before concealment", "Insulation resistance tested"],
  },
  flooring: {
    requiredDisciplines: ["architectural", "interiors"],
    modelElementClasses: ["IfcSlab", "IfcSpace"],
    holdPoints: ["Substrate level and moisture approved", "Finish sample approved"],
  },
  painting: {
    requiredDisciplines: ["architectural"],
    modelElementClasses: ["IfcWall", "IfcSlab", "IfcRoof"],
    holdPoints: ["Surface preparation inspected", "Shade and finish sample approved"],
  },
  interiors: {
    requiredDisciplines: ["architectural", "interiors", "electrical", "plumbing"],
    modelElementClasses: ["IfcDoor", "IfcWindow", "IfcFurniture", "IfcLightFixture"],
    holdPoints: ["Site dimensions verified", "Snag list closed before handover"],
  },
};

const PREFLIGHT: WorkPackage = {
  id: "pre-construction",
  sequence: 0,
  name: "Pre-construction & approvals",
  summary: "Approve drawings, model scope, site information and procurement responsibilities.",
  dependencies: [],
  requiredDisciplines: ["architectural", "structural", "plumbing", "electrical"],
  modelElementClasses: [],
  materialProductIds: [],
  holdPoints: ["Drawing register approved", "IFC model approved for takeoff"],
};

const HANDOVER: WorkPackage = {
  id: "testing-handover",
  sequence: PHASES.length + 1,
  name: "Testing, snagging & handover",
  summary: "Commission services, close defects and preserve as-built evidence.",
  dependencies: [PHASES.at(-1)?.id ?? "interiors"],
  requiredDisciplines: ["architectural", "structural", "plumbing", "electrical"],
  modelElementClasses: [],
  materialProductIds: [],
  holdPoints: ["Systems commissioned", "As-built records accepted", "Final snag list closed"],
};

export const SOP_WORK_PACKAGES: readonly WorkPackage[] = [
  PREFLIGHT,
  ...PHASES.map<WorkPackage>((phase, index) => {
    const metadata = PHASE_META[phase.id] ?? {
      requiredDisciplines: [],
      modelElementClasses: [],
      holdPoints: [],
    };
    return {
      id: phase.id,
      sequence: index + 1,
      name: phase.name,
      summary: phase.description,
      sourcePhaseId: phase.id,
      dependencies: [index === 0 ? PREFLIGHT.id : (PHASES[index - 1]?.id ?? PREFLIGHT.id)],
      requiredDisciplines: metadata.requiredDisciplines,
      modelElementClasses: metadata.modelElementClasses,
      materialProductIds: Array.from(
        new Set(phase.subcategories.flatMap((subcategory) => subcategory.productIds)),
      ),
      holdPoints: metadata.holdPoints,
    };
  }),
  HANDOVER,
];

export function buildProjectSop(
  readiness: SopReadiness,
  statuses: Partial<Record<string, WorkPackageStatus>> = {},
): ProjectWorkPackage[] {
  return SOP_WORK_PACKAGES.map((workPackage, index, allPackages) => {
    const requestedStatus = statuses[workPackage.id];
    const dependenciesComplete = workPackage.dependencies.every(
      (dependencyId) => statuses[dependencyId] === "complete",
    );
    const blockers: string[] = [];

    if (workPackage.id === PREFLIGHT.id) {
      if (!readiness.drawingsApproved) blockers.push("Drawing register approval required");
      if (!readiness.modelApproved) blockers.push("IFC model approval required");
    } else {
      if (!dependenciesComplete) blockers.push("Previous work package must be completed");
      if (!readiness.takeoffApproved) blockers.push("Material takeoff approval required");
      if (!readiness.materialsConfirmed) blockers.push("Supplier availability must be confirmed");
    }

    const priorCompleteCount = allPackages
      .slice(0, index)
      .filter((item) => statuses[item.id] === "complete").length;
    const status: WorkPackageStatus =
      requestedStatus === "complete"
        ? "complete"
        : blockers.length > 0
          ? "blocked"
          : (requestedStatus ?? "ready");

    return {
      ...workPackage,
      status,
      completionPercent:
        status === "complete"
          ? 100
          : status === "awaiting-approval"
            ? 90
            : status === "in-progress"
              ? 50
              : priorCompleteCount > 0 && status === "ready"
                ? 5
                : 0,
      blockers,
    };
  });
}

export function sopCompletion(packages: readonly ProjectWorkPackage[]): number {
  if (packages.length === 0) return 0;
  return Math.round(
    packages.reduce((total, workPackage) => total + workPackage.completionPercent, 0) /
      packages.length,
  );
}
