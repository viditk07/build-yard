import { Link } from "@tanstack/react-router";
import { formatINR, getSupplier, type Product } from "@/lib/catalog";
import { MaterialTile } from "./material-tile";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const supplier = getSupplier(product.supplierId);
  const { add } = useCart();

  return (
    <article className="surface-card group flex flex-col overflow-hidden rounded-xl">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="block"
      >
        <MaterialTile category={product.category} className="h-36 w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-spec text-muted-foreground">{product.grade}</span>
          <span className="text-spec text-primary">
            {product.stock > 0 ? "In stock" : "On order"}
          </span>
        </div>
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="font-display text-base leading-snug font-semibold hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {supplier?.name} · {supplier?.city}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="font-display text-lg font-semibold">
              {formatINR(product.price)}
            </p>
            <p className="text-xs text-muted-foreground">
              per {product.unit} · MOQ {product.moq}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              add(product.id, product.moq);
              toast.success(`${product.moq} × ${product.unit} added`, {
                description: product.name,
              });
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}
