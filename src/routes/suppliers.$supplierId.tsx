import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getSupplier, supplierProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/suppliers/$supplierId")({
  loader: ({ params }) => {
    const supplier = getSupplier(params.supplierId);
    if (!supplier) throw notFound();
    return { supplier };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Supplier not found — BuildYard" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { supplier } = loaderData;
    const title = `${supplier.name} — Supplier on BuildYard`;
    return {
      meta: [
        { title },
        { name: "description", content: supplier.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: supplier.blurb },
      ],
    };
  },
  component: SupplierPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold">Supplier not found</h1>
      <Link to="/suppliers" className="mt-4 inline-block text-primary hover:underline">
        All suppliers
      </Link>
    </div>
  ),
});

function SupplierPage() {
  const { supplier } = Route.useLoaderData();
  const products = supplierProducts(supplier.id);

  return (
    <div>
      <header className="border-b border-border bg-concrete text-concrete-foreground">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-spec text-ember">Verified supplier</p>
          <h1 className="mt-3 font-display text-4xl font-bold">{supplier.name}</h1>
          <p className="mt-3 max-w-2xl text-concrete-foreground/75">{supplier.blurb}</p>
          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Location", supplier.city],
              ["Trading since", String(supplier.since)],
              ["Rating", `★ ${supplier.rating}`],
              ["Fulfilment", supplier.fulfilment],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-spec text-concrete-foreground/50">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-xl font-semibold">
          {products.length} products from this supplier
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
