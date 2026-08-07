import { Link } from "@tanstack/react-router";
import { ShoppingCart, Search } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="text-muted-foreground" />

        <form
          className="group flex h-10 max-w-xl flex-1 items-center gap-2 rounded-full border border-border/70 bg-card px-4 transition-shadow focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_14%,transparent)]"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/products", search: { q: q.trim() || undefined } });
          }}
        >
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cement, TMT bars, ply…"
            aria-label="Search materials"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/build"
            className="hidden rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
          >
            Build stages
          </Link>
          <Link
            to="/products"
            className="hidden rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
          >
            Catalog
          </Link>
          <Link
            to="/visualiser"
            className="hidden rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
          >
            3D Visualiser
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-medium transition-colors hover:bg-secondary/70"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            <span className="sr-only">Cart</span>
            {count > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-[image:var(--gradient-ember)] px-1.5 text-xs font-semibold text-ember-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-card/60 py-10">
      <div className="flex flex-col gap-2 px-6">
        <p className="font-display text-sm font-semibold">BuildYard</p>
        <p className="max-w-xl text-sm text-muted-foreground">
          Trade supply marketplace for contractors. Prices are indicative and exclude
          GST until checkout.
        </p>
      </div>
    </footer>
  );
}
