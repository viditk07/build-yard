import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR, getSupplier } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { MaterialTile } from "@/components/material-tile";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Order — BuildYard" },
      {
        name: "description",
        content: "Review materials, quantities and delivery costs before checkout.",
      },
      { property: "og:title", content: "Your Order — BuildYard" },
      {
        property: "og:description",
        content: "Review your construction materials order before checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, delivery, gst, total, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Your order is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add materials from the catalog to build a delivery.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Browse materials</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Your order</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {items.map(({ product, qty, lineTotal }) => (
            <li key={product.id} className="surface-card flex gap-4 rounded-xl p-4">
              <MaterialTile
                category={product.category}
                className="hidden size-24 shrink-0 rounded-xl sm:flex"
              />
              <div className="flex-1">
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id }}
                  className="font-display font-semibold hover:text-primary"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {getSupplier(product.supplierId)?.name} · {formatINR(product.price)} /{" "}
                  {product.unit}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-input">
                    <button
                      className="px-3 py-1.5 leading-none"
                      aria-label={`Decrease ${product.name}`}
                      onClick={() => setQty(product.id, Math.max(0, qty - product.moq))}
                    >
                      −
                    </button>
                    <span className="w-14 text-center text-sm">{qty}</span>
                    <button
                      className="px-3 py-1.5 leading-none"
                      aria-label={`Increase ${product.name}`}
                      onClick={() => setQty(product.id, qty + product.moq)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(product.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>
              <p className="font-display font-semibold">{formatINR(lineTotal)}</p>
            </li>
          ))}
        </ul>

        <aside className="surface-card h-fit rounded-xl p-5">
          <h2 className="text-spec text-muted-foreground">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            <Row label="Delivery" value={delivery === 0 ? "Free" : formatINR(delivery)} />
            <Row label="GST (18%)" value={formatINR(gst)} />
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display font-semibold">Total</span>
            <span className="font-display text-xl font-bold">{formatINR(total)}</span>
          </div>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Free delivery on orders above {formatINR(100000)}.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
