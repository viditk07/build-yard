import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PRODUCTS, SUPPLIERS, type Category } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

type ProductSearch = {
  q?: string | undefined;
  category?: string | undefined;
  supplier?: string | undefined;
  sort?: string | undefined;
};

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    supplier: typeof search["supplier"] === "string" ? search["supplier"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Materials Catalog — BuildYard" },
      {
        name: "description",
        content:
          "Browse cement, TMT steel, timber, blocks, aggregates and site tools with trade pricing and minimum order quantities.",
      },
      { property: "og:title", content: "Materials Catalog — BuildYard" },
      {
        property: "og:description",
        content: "Filter construction materials by category, supplier and price.",
      },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  let list = PRODUCTS.filter((p) => {
    if (search.category && p.category !== search.category) return false;
    if (search.supplier && p.supplierId !== search.supplier) return false;
    if (search.q) {
      const q = search.q.toLowerCase();
      const hay = `${p.name} ${p.category} ${p.grade} ${p.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (search.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (search.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  const set = (patch: Partial<ProductSearch>) =>
    navigate({ search: (prev: ProductSearch) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Materials catalog</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {list.length} product{list.length === 1 ? "" : "s"}
        {search.q ? ` matching “${search.q}”` : ""}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <h2 className="text-spec text-muted-foreground">Category</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <FilterButton
                  active={!search.category}
                  onClick={() => set({ category: undefined })}
                >
                  All categories
                </FilterButton>
              </li>
              {CATEGORIES.map((c: Category) => (
                <li key={c}>
                  <FilterButton
                    active={search.category === c}
                    onClick={() => set({ category: c })}
                  >
                    {c}
                  </FilterButton>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-spec text-muted-foreground">Supplier</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <FilterButton
                  active={!search.supplier}
                  onClick={() => set({ supplier: undefined })}
                >
                  All suppliers
                </FilterButton>
              </li>
              {SUPPLIERS.map((s) => (
                <li key={s.id}>
                  <FilterButton
                    active={search.supplier === s.id}
                    onClick={() => set({ supplier: s.id })}
                  >
                    {s.name}
                  </FilterButton>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-spec text-muted-foreground">Sort</h2>
            <select
              value={search.sort ?? ""}
              onChange={(e) => set({ sort: e.target.value || undefined })}
              className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              aria-label="Sort products"
            >
              <option value="">Relevance</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </aside>

        <div>
          {list.length === 0 ? (
            <div className="surface-card rounded-xl p-10 text-center">
              <p className="font-display font-semibold">No materials matched</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try clearing filters or searching a different term.
              </p>
              <Link
                to="/products"
                search={{}}
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-2 py-1.5 text-left transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
