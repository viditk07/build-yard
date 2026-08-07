import { createFileRoute, Link } from "@tanstack/react-router";
import { PHASES, phaseProducts, phaseSupplierIds } from "@/lib/phases";
import { getSupplier } from "@/lib/catalog";

export const Route = createFileRoute("/build/")({
  head: () => ({
    meta: [
      { title: "Build Stages — Materials by Construction Phase | BuildYard" },
      {
        name: "description",
        content:
          "Shop residential construction materials stage by stage: foundation, civil structure, plumbing, electrical, flooring, painting and interior fit-out.",
      },
      { property: "og:title", content: "Build Stages — Materials by Construction Phase" },
      {
        property: "og:description",
        content:
          "Pick a stage like plumbing or electrical and get every material it needs, with supplier details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuildStages,
});

function BuildStages() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-spec text-primary">Build by stage</p>
      <h1 className="mt-3 font-display text-3xl font-bold">
        Materials for every stage of a house
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Follow the build sequence — from foundation earthwork through civil work,
        plumbing, electrical, flooring, paint and interiors. Open any stage to see its
        sub-categories, the materials each one needs and the suppliers who ship them.
      </p>

      <ol className="mt-8 space-y-4">
        {PHASES.map((phase) => {
          const products = phaseProducts(phase);
          const suppliers = phaseSupplierIds(phase)
            .map((id) => getSupplier(id)?.name)
            .filter(Boolean);
          return (
            <li key={phase.id}>
              <Link
                to="/build/$phaseId"
                params={{ phaseId: phase.id }}
                className="surface-card block rounded-xl p-5 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-display font-semibold text-primary">
                    {phase.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold">{phase.name}</h2>
                    <p className="text-spec text-muted-foreground">{phase.tagline}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {phase.subcategories.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-xl bg-secondary px-2 py-1 text-xs text-muted-foreground"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-spec text-muted-foreground">
                      {products.length} materials · {suppliers.length} suppliers
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
