import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PRODUCTS, SUPPLIERS } from "@/lib/catalog";
import { PHASES, phaseProducts } from "@/lib/phases";
import { ProductCard } from "@/components/product-card";
import { CategoryIcon } from "@/components/material-tile";
import { CATEGORY_IMAGES } from "@/lib/category-images";

import { Button } from "@/components/ui/button";
import heroYard from "@/assets/hero-yard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuildYard — Construction Materials Marketplace" },
      {
        name: "description",
        content:
          "Compare and order cement, TMT steel, timber, blocks, aggregates and site tools from verified trade suppliers.",
      },
      { property: "og:title", content: "BuildYard — Construction Materials Marketplace" },
      {
        property: "og:description",
        content:
          "Trade pricing on cement, steel, timber and aggregates from verified suppliers.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = PRODUCTS.slice(0, 8);

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-concrete text-concrete-foreground">
        <img
          src={heroYard}
          alt="Construction materials supply yard stacked with blocks, rebar and cement bags"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-spec text-ember">Trade supply marketplace</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] font-bold sm:text-6xl">
            Every material your site needs, from one yard.
          </h1>
          <p className="mt-5 max-w-xl text-base text-concrete-foreground/75">
            Cement, TMT steel, shuttering ply, blocks and aggregates — priced by the
            load, shipped by verified suppliers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/build">Shop by build stage</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-concrete-foreground/40 bg-concrete-foreground/10 text-concrete-foreground hover:bg-concrete-foreground/20 hover:text-concrete-foreground"
            >
              <Link to="/products">Browse the catalog</Link>
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border/30 pt-6">
            {[
              ["Verified suppliers", `${SUPPLIERS.length}`],
              ["SKUs listed", `${PRODUCTS.length}`],
              ["Dispatch", "24–48h"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-spec text-concrete-foreground/50">{label}</dt>
                <dd className="font-display text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Build a house, stage by stage
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Pick the stage you are at — foundation, civil work, plumbing, electrical,
              flooring, paint or interiors — and get every material it needs with
              supplier details.
            </p>
          </div>
          <Link to="/build" className="shrink-0 text-sm text-primary hover:underline">
            All stages
          </Link>
        </div>
        <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase) => (
            <li key={phase.id}>
              <Link
                to="/build/$phaseId"
                params={{ phaseId: phase.id }}
                className="surface-card flex h-full flex-col gap-2 rounded-xl p-4 transition-colors hover:border-primary"
              >
                <span className="text-spec text-primary">Stage {phase.step}</span>
                <span className="font-display leading-tight font-semibold">
                  {phase.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {phase.subcategories.length} sub-categories ·{" "}
                  {phaseProducts(phase).length} materials
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <h2 className="text-spec text-muted-foreground">Shop by category</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/products"
              search={{ category: c }}
              className="surface-card group overflow-hidden rounded-xl transition-colors hover:border-primary"
            >
              <img
                src={CATEGORY_IMAGES[c]}
                alt={`${c} category`}
                width={512}
                height={340}
                loading="lazy"
                className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="flex items-center gap-2 p-3">
                <CategoryIcon category={c} className="size-4 shrink-0 text-primary" />
                <span className="font-display text-sm leading-tight font-semibold">
                  {c}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Moving fast this week</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Suppliers on BuildYard</h2>
          <Link to="/suppliers" className="text-sm text-primary hover:underline">
            All suppliers
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPLIERS.map((s) => (
            <Link
              key={s.id}
              to="/suppliers/$supplierId"
              params={{ supplierId: s.id }}
              className="surface-card rounded-xl p-4 transition-colors hover:border-primary"
            >
              <p className="font-display font-semibold">{s.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.city}</p>
              <p className="mt-3 text-spec text-primary">★ {s.rating} · since {s.since}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
