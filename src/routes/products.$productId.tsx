import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatINR,
  getProduct,
  getSupplier,
  PRODUCTS,
  supplierProducts,
} from "@/lib/catalog";
import { MaterialTile } from "@/components/material-tile";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/products/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product not found — BuildYard" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — BuildYard`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description },
      ],
    };
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold">Material not found</h1>
      <Link to="/products" className="mt-4 inline-block text-primary hover:underline">
        Back to catalog
      </Link>
    </div>
  ),
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const supplier = getSupplier(product.supplierId);
  const { add } = useCart();
  const [qty, setQty] = useState(product.moq);

  const related = supplierProducts(product.supplierId)
    .filter((p) => p.id !== product.id)
    .concat(PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-primary">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <Link
          to="/products"
          search={{ category: product.category }}
          className="hover:text-primary"
        >
          {product.category}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <MaterialTile
          category={product.category}
          className="h-72 w-full rounded-xl border border-border"
        />

        <div>
          <p className="text-spec text-primary">{product.grade}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description}</p>

          {supplier && (
            <Link
              to="/suppliers/$supplierId"
              params={{ supplierId: supplier.id }}
              className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Sold by {supplier.name} · {supplier.city}
            </Link>
          )}

          <div className="surface-card mt-6 rounded-xl p-5">
            <p className="font-display text-3xl font-semibold">
              {formatINR(product.price)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {product.unit}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Minimum order {product.moq} {product.unit} · {product.stock.toLocaleString("en-IN")} available
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-input">
                <button
                  className="px-3 py-2 text-lg leading-none"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q: number) => Math.max(product.moq, q - product.moq))}
                >
                  −
                </button>
                <input
                  type="number"
                  value={qty}
                  min={product.moq}
                  aria-label="Quantity"
                  onChange={(e) =>
                    setQty(Math.max(product.moq, Number(e.target.value) || product.moq))
                  }
                  className="w-20 bg-transparent px-2 py-2 text-center text-sm outline-none"
                />
                <button
                  className="px-3 py-2 text-lg leading-none"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q: number) => q + product.moq)}
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  add(product.id, qty);
                  toast.success("Added to cart", {
                    description: `${qty} × ${product.unit} — ${product.name}`,
                  });
                }}
              >
                Add to cart · {formatINR(product.price * qty)}
              </Button>
            </div>
          </div>

          <dl className="mt-8 divide-y divide-border border-y border-border">
            {product.specs.map((s: { label: string; value: string }) => (
              <div key={s.label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-semibold">Often ordered together</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
