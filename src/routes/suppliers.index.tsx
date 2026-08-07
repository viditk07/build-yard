import { createFileRoute, Link } from "@tanstack/react-router";
import { SUPPLIERS, supplierProducts } from "@/lib/catalog";

export const Route = createFileRoute("/suppliers/")({
  head: () => ({
    meta: [
      { title: "Verified Suppliers — BuildYard" },
      {
        name: "description",
        content:
          "Meet the mills, quarries and trade merchants supplying materials on BuildYard.",
      },
      { property: "og:title", content: "Verified Suppliers — BuildYard" },
      {
        property: "og:description",
        content: "Mills, quarries and merchants shipping materials to your site.",
      },
    ],
  }),
  component: SupplierList,
});

function SupplierList() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Suppliers</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Every supplier is trade-verified with documented certifications and delivery
        commitments.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SUPPLIERS.map((s) => (
          <Link
            key={s.id}
            to="/suppliers/$supplierId"
            params={{ supplierId: s.id }}
            className="surface-card rounded-xl p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{s.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {s.city} · since {s.since}
                </p>
              </div>
              <span className="text-spec text-primary">★ {s.rating}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.blurb}</p>
            <p className="mt-4 text-spec text-muted-foreground">
              {supplierProducts(s.id).length} products · {s.fulfilment}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
