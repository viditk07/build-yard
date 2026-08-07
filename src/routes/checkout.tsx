import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — BuildYard" },
      {
        name: "description",
        content: "Confirm site delivery details and place your materials order.",
      },
      { property: "og:title", content: "Checkout — BuildYard" },
      {
        property: "og:description",
        content: "Confirm delivery details and place your construction materials order.",
      },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  company: z.string().trim().min(2, "Enter your company name").max(100),
  contact: z.string().trim().min(2, "Enter a contact name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  site: z.string().trim().min(8, "Enter the full site address").max(300),
  notes: z.string().trim().max(500).optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function Checkout() {
  const { items, subtotal, delivery, gst, total, clear } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [orderId, setOrderId] = useState<string | null>(null);

  if (orderId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-5 font-display text-3xl font-bold">Order placed</h1>
        <p className="mt-3 text-muted-foreground">
          Reference <span className="font-semibold text-foreground">{orderId}</span>. Each
          supplier will confirm dispatch slots by phone within 4 working hours.
        </p>
        <Button asChild className="mt-8">
          <Link to="/products">Order more materials</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Nothing to check out</h1>
        <Button asChild className="mt-6">
          <Link to="/products">Browse materials</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setOrderId(`BY-${Math.floor(100000 + Math.random() * 899999)}`);
    clear();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>

      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="surface-card space-y-4 rounded-xl p-5">
          <h2 className="text-spec text-muted-foreground">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="company" label="Company" error={errors.company} />
            <Field name="contact" label="Site contact" error={errors.contact} />
            <Field name="phone" label="Phone" error={errors.phone} />
            <Field name="email" label="Email" type="email" error={errors.email} />
          </div>
          <Field name="site" label="Site address" error={errors.site} />
          <div>
            <label htmlFor="notes" className="text-sm font-medium">
              Delivery notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Access restrictions, unloading equipment, preferred slot…"
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <aside className="surface-card h-fit rounded-xl p-5">
          <h2 className="text-spec text-muted-foreground">
            {items.length} line{items.length === 1 ? "" : "s"}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map(({ product, qty, lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {product.name} × {qty}
                </span>
                <span>{formatINR(lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{delivery === 0 ? "Free" : formatINR(delivery)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">GST (18%)</dt>
              <dd>{formatINR(gst)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display font-semibold">Total</span>
            <span className="font-display text-xl font-bold">{formatINR(total)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-5 w-full">
            Place order
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Demo checkout — no payment is taken.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  error,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string | undefined;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
