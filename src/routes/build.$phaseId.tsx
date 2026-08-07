import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { Phase } from "@/lib/phases";
import {
  getPhase,
  PHASES,
  phaseSupplierIds,
  subcategoryProducts,
} from "@/lib/phases";
import { getSupplier } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/build/$phaseId")({
  loader: ({ params }) => {
    const phase = getPhase(params.phaseId);
    if (!phase) throw notFound();
    return { phase };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Stage not found — BuildYard" }, { name: "robots", content: "noindex" }],
      };
    }
    const { phase } = loaderData;
    const title = `${phase.name} Materials — BuildYard`;
    const description = `${phase.description} Compare prices, minimum order quantities and suppliers for the ${phase.name.toLowerCase()} stage.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PhasePage,
  notFoundComponent: PhaseNotFound,
});

function PhasePage() {
  const { phase } = Route.useLoaderData() as { phase: Phase };
  const suppliers = phaseSupplierIds(phase)
    .map((id) => getSupplier(id))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/build" className="text-sm text-primary hover:underline">
        ← All build stages
      </Link>

      <p className="mt-6 text-spec text-primary">Stage {phase.step}</p>
      <h1 className="mt-2 font-display text-3xl font-bold">{phase.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{phase.description}</p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Sub-categories">
        {phase.subcategories.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {s.name}
          </a>
        ))}
      </nav>

      <section className="mt-8">
        <h2 className="text-spec text-muted-foreground">Suppliers for this stage</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s!.id}
              to="/suppliers/$supplierId"
              params={{ supplierId: s!.id }}
              className="surface-card rounded-xl p-4 transition-colors hover:border-primary"
            >
              <p className="font-display font-semibold">{s!.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s!.city}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s!.fulfilment}</p>
              <p className="mt-2 text-spec text-primary">★ {s!.rating}</p>
            </Link>
          ))}
        </div>
      </section>

      {phase.subcategories.map((sub) => {
        const products = subcategoryProducts(sub);
        return (
          <section key={sub.id} id={sub.id} className="mt-12 scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold">{sub.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{sub.note}</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-14 border-t border-border pt-6">
        <h2 className="text-spec text-muted-foreground">Next stages</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PHASES.filter((p) => p.id !== phase.id).map((p) => (
            <Link
              key={p.id}
              to="/build/$phaseId"
              params={{ phaseId: p.id }}
              className="rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {p.step}. {p.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PhaseNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Stage not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That build stage does not exist.
      </p>
      <Link to="/build" className="mt-4 inline-block text-sm text-primary hover:underline">
        Browse all build stages
      </Link>
    </div>
  );
}
