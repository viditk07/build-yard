# BuildYard

## Project summary

BuildYard is a responsive construction-materials marketplace prototype for Indian
contractors and home builders. It lets a buyer discover materials through a normal
catalog or through the sequence of a residential build, compare supplier information,
assemble an order, and turn a raster floor plan into a simple browser-rendered 3D wall
model.

The current repository is a polished, server-rendered product demo. The catalog,
supplier data, and build-stage mappings are static TypeScript data; the cart is stored
in the browser; and checkout does not create a real order or take payment. This boundary
is important: the UI demonstrates the intended buying journey, but the application does
not yet have a database, authentication, supplier integrations, or a transactional
backend.

## Product intent

### Problem

Construction procurement is commonly split across merchants, mills, and specialist
suppliers. Buyers need to know both *what* is required at a given stage and *who* can
supply it, while accounting for trade quantities, delivery, and tax.

### Value proposition

- One catalog for structural, services, finishing, and interior materials.
- Stage-by-stage discovery for buyers who think in terms of the build sequence rather
  than product taxonomy.
- Visible trade units, minimum order quantities, stock, specifications, and supplier
  details.
- An order summary that makes delivery and GST explicit.
- A local 2D-to-3D visualisation aid that does not upload floor plans to a server.

### Primary users

- Contractors and site engineers planning or replenishing a residential build.
- Small builders comparing materials and suppliers.
- Home owners who need a guided list of materials for each construction stage.

## Current implementation

| Capability | Status | Notes |
| --- | --- | --- |
| Marketing home page | Implemented | Hero, build stages, categories, featured products, and suppliers. |
| Product catalog | Implemented | Text search, category and supplier filters, and price sorting use URL search parameters. |
| Product details | Implemented | Specifications, supplier link, stock, MOQ-aware quantity selection, and related products. |
| Supplier directory | Implemented | Eleven static supplier profiles and their products. “Verified” is presentation data, not a live verification workflow. |
| Build-stage shopping | Implemented | Seven stages and 38 subcategories map the catalog to a residential construction sequence. |
| Cart | Implemented locally | Persists to `localStorage` under `buildyard.cart.v1`; there is no account or server-side cart. |
| Pricing summary | Implemented locally | INR prices, ₹2,500 delivery up to ₹100,000 subtotal, free delivery above ₹100,000, and 18% GST on subtotal plus delivery. |
| Checkout form | Demo only | Zod validates contact and site fields. Submission generates a random `BY-xxxxxx` reference, clears the cart, and sends nothing. |
| Floor-plan visualiser | Implemented locally | PNG/JPG upload, automatic raster wall detection, manual tracing, scale controls, and an orbitable Three.js model. |
| SEO/error states | Implemented | Per-route metadata, route-specific not-found states, React error handling, and a fallback HTML 500 page. |
| Accounts, orders, and payments | Not implemented | No authentication, database, API, payment provider, or order history. |
| Live stock and logistics | Not implemented | Stock, fulfilment, ratings, and dispatch language are static demo values. |

## User journeys

### Catalog-led purchase

1. Search from the header or open the catalog.
2. Filter by category or supplier and optionally sort by price.
3. Review product specifications, price, unit, MOQ, stock, and supplier.
4. Add one or more MOQ-sized quantities to the cart.
5. Adjust quantities and review delivery, GST, and the final total.
6. Enter site details in the demo checkout and receive a local reference.

### Stage-led purchase

1. Open **Build stages**.
2. Choose a stage from foundation through interior fit-out.
3. Browse its subcategories, applicable suppliers, and material cards.
4. Continue through the normal product and cart flow.

### Plan visualisation

1. Upload a floor-plan image.
2. Let the browser detect dark wall shapes or trace additional wall runs manually.
3. Set real plan width, wall height, and wall thickness.
4. Orbit the generated 3D model and tune detection sensitivity as needed.

## Application map

| Route | Purpose |
| --- | --- |
| `/` | Marketplace landing page and primary discovery entry point. |
| `/products` | Searchable and filterable materials catalog. |
| `/products/:productId` | Product details and add-to-cart controls. |
| `/suppliers` | Supplier directory. |
| `/suppliers/:supplierId` | Supplier profile and associated products. |
| `/build` | Ordered residential build stages. |
| `/build/:phaseId` | Stage subcategories, suppliers, and products. |
| `/cart` | Persistent client-side cart and calculated totals. |
| `/checkout` | Validated demo delivery form and order confirmation. |
| `/visualiser` | Client-side floor-plan tracing and Three.js preview. |

Routes are file-based under `src/routes`. `src/routeTree.gen.ts` is generated by the
TanStack Router plugin and must not be edited manually.

## Architecture

```text
TanStack Start request
        |
        v
SSR shell + file routes ---- static catalog / build-stage data
        |                              |
        v                              v
React UI ---------------------- product and supplier selectors
   |              |
   |              +---- cart context ---- browser localStorage
   |
   +---- visualiser ---- Canvas pixel analysis ---- Three.js/WebGL
```

### Runtime composition

- `src/start.ts` registers server request middleware. It preserves HTTP-style errors,
  renders a safe HTML page for unexpected failures, and applies CSRF middleware to
  server functions.
- `src/server.ts` wraps the generated TanStack Start server entry. It normalises a
  catastrophic JSON 500 response from the underlying H3/Nitro stack into the HTML
  fallback page while retaining captured error detail in logs.
- `src/router.tsx` creates a router and a React Query client per router instance.
- `src/routes/__root.tsx` owns document metadata, providers, the application sidebar,
  header, footer, nested route outlet, error boundary, and toast host.
- Route loaders for dynamic product, supplier, and phase pages perform synchronous
  lookups against local arrays and produce route-level 404s for unknown IDs.
- React Query is wired into the application context but is not currently used for
  remote queries or mutations.

### Domain data

`src/lib/catalog.ts` is the in-memory source of truth:

- 11 categories
- 11 suppliers
- 63 products
- Product fields: ID, name, category, supplier, price, unit, MOQ, stock, grade,
  description, and labelled specifications
- Supplier fields: ID, name, city, trading year, rating, fulfilment, and description

`src/lib/phases.ts` contains seven build phases and 38 subcategories. Subcategories
reference catalog products by ID; helper functions resolve products and unique suppliers
for a phase. A broken product ID therefore fails silently by being omitted from the
resolved list, so cross-reference validation should be added if this data remains
code-based.

### Cart and pricing

`src/lib/cart.tsx` provides the cart through React context. Lines contain only a product
ID and quantity; displayed items and totals are derived from the current catalog.

```text
subtotal = sum(product price × quantity)
delivery = 0 for an empty cart or subtotal > ₹100,000; otherwise ₹2,500
gst      = round((subtotal + delivery) × 18%)
total    = subtotal + delivery + gst
```

The cart restores after client hydration and writes changes back to `localStorage`.
There is currently no schema validation or version migration for stored cart JSON beyond
the versioned storage key.

### Floor-plan processing

`src/lib/plan-trace.ts` downsamples the uploaded image to a browser canvas, converts it
to grayscale, chooses an Otsu threshold, creates a dark-pixel mask, removes isolated
pixels, and greedily merges repeated horizontal runs into rectangles. The visualiser
extrudes those rectangles and manually traced line segments into Three.js box geometry.

This is a fast visual approximation, not a CAD/BIM parser. It does not understand rooms,
doors, windows, dimensions, wall topology, multiple floors, or structural semantics.
Text and dimension lines may be mistaken for walls depending on the drawing and selected
sensitivity.

## Technology

- TypeScript with strict compiler settings
- React 19
- TanStack Start and TanStack Router with SSR and file-based routing
- TanStack Query provider (prepared for future server data)
- Vite 8 and Nitro; the Lovable Vite preset defaults production builds to a Cloudflare
  target
- Tailwind CSS 4 with CSS design tokens
- shadcn-style components built on Radix UI
- Three.js with OrbitControls for 3D rendering
- Zod for checkout form validation
- Lucide icons and Sonner notifications

The visual system uses Sora for display text, Manrope for body text, an ember-orange
accent, concrete neutrals, reusable `surface-card` and `text-spec` utilities, and a
responsive collapsible sidebar. Dark-theme tokens exist, but the current UI does not
expose a theme switch.

## Repository guide

```text
src/
  assets/             Marketplace and category imagery
  components/         Application chrome, product UI, and reusable UI primitives
  hooks/              Shared React hooks
  lib/                Catalog, build phases, cart, plan tracing, and error handling
  routes/             TanStack file routes
  routeTree.gen.ts    Generated route manifest
  router.tsx          Router and query-client construction
  server.ts           SSR server-entry wrapper
  start.ts            TanStack Start middleware
  styles.css          Tailwind theme and application utilities
public/                Static favicon and robots file
```

## Local development

The repository includes `bun.lock` and a Bun supply-chain policy, but the package scripts
are standard and can also be run with npm. No environment variables are required for the
current static prototype.

```sh
# Preferred when Bun is available
bun install
bun run dev

# npm alternative
npm install
npm run dev
```

Useful commands:

```sh
npm run dev        # start the Vite development server
npm run build      # create the production SSR build
npm run build:dev  # build using development mode
npm run preview    # preview a built application
npm run lint       # ESLint plus Prettier checks
npm run format     # write Prettier formatting changes
```

There is no automated test command or test suite at present. A change should at minimum
pass `npm run lint` and `npm run build`, followed by manual checks of the affected route
at mobile and desktop widths.

## Important development constraints

- This repository is connected to Lovable. Do not force-push or rewrite published Git
  history; pushed commits sync back into the Lovable editor.
- Do not manually add TanStack Start, React, Tailwind, Nitro, path-alias, or devtools
  plugins to `vite.config.ts`. `@lovable.dev/vite-tanstack-config` already installs and
  orders them.
- Keep the root route's `<Outlet />`; nested file routes depend on it.
- Do not manually edit `src/routeTree.gen.ts`.
- Use the `@/*` alias for `src/*` imports where practical.
- Keep browser-only APIs inside client lifecycle/event code so SSR remains safe.
- Preserve the custom SSR error path when changing server entry or middleware behavior.
- `bunfig.toml` rejects package versions published less than 24 hours ago, with a small
  Lovable-specific allowlist. Review dependency changes deliberately.

## Known gaps and risks

### Product and commerce

- Product, price, stock, supplier, certification, rating, and fulfilment information is
  hard-coded and can drift from reality.
- There is no user identity, role model, saved address, quote flow, purchase order,
  order history, or supplier portal.
- Checkout is not transactional and does not contact suppliers, reserve stock, calculate
  location-specific delivery, create an invoice, or process payment.
- GST and delivery rules are global constants rather than configurable tax/logistics
  rules. Product prices are treated as GST-exclusive throughout.
- Cart quantities can be manipulated from local storage and are not checked against MOQ
  or stock at checkout.

### Engineering

- No automated unit, integration, accessibility, or end-to-end tests exist.
- The catalog is a large monolithic source file and has no automated integrity checks.
- The UI downloads Google Fonts at runtime; deployments with strict privacy or offline
  requirements should self-host them.
- The extracted repository contains Windows `:Zone.Identifier` metadata files. They are
  unused by the application and should be removed in a dedicated cleanup change after
  confirming they are not intentionally retained.
- The project declares no supported Node.js engine, and dependency reproducibility
  currently depends on using the committed Bun lockfile.

### Visualiser

- Analysis is synchronous after a short timeout and may pause the UI on complex images.
- Uploaded object URLs and some rebuilt Three.js resources are not explicitly disposed,
  which may increase memory use during repeated uploads or parameter changes.
- Output cannot currently be saved, shared, exported, measured, or connected to a bill
  of materials.

## Recommended delivery roadmap

1. **Protect the current prototype:** add catalog/phase integrity tests, pricing tests,
   cart tests, route smoke tests, and a CI workflow for lint and build.
2. **Introduce a real domain backend:** model users, suppliers, products, prices,
   inventory, addresses, carts, quotes, orders, and order events in persistent storage.
3. **Make checkout transactional:** server-side validation and pricing, inventory checks,
   idempotent order creation, supplier notifications, payment or purchase-order support,
   and auditable confirmations.
4. **Add marketplace operations:** supplier onboarding/verification, serviceability,
   delivery-slot calculation, inventory feeds, admin controls, and content ownership.
5. **Harden the product:** authentication and authorization, rate limiting, monitoring,
   privacy and retention controls, accessibility testing, performance budgets, and SEO
   assets such as canonical URLs and social images.
6. **Evolve the visualiser:** move detection to a worker, improve line/room/opening
   recognition, dispose resources correctly, save projects, and derive an editable bill
   of materials only after geometry quality is measurable.

## Definition of production readiness

BuildYard should not be described as a live marketplace until prices and inventory are
server-authoritative, users and suppliers are authenticated, checkout creates a durable
and idempotent order, sensitive data is protected, payment/procurement and fulfilment
workflows are integrated, operational claims are backed by real processes, and the main
buyer journeys are covered by automated tests and observable in production.
