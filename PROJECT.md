# BuildYard

## Project summary

BuildYard is an IFC-first design-to-procurement MVP for Indian contractors, builders,
site engineers, and home owners. A user creates a house project, organizes its drawings
by discipline, loads an IFC building model, selects a semantic model element, reviews a
formula-backed material takeoff and supplier match, and moves those materials into a
cart. A dependency-based construction SOP connects procurement decisions to the order in
which a house is built.

The full vertical journey now runs in the browser. Project records and document metadata
use `localStorage`, uploaded files use IndexedDB, and IFC geometry is parsed locally with
`web-ifc`. Catalog, supplier, pricing, and build-stage data remain static TypeScript data;
checkout does not create a durable order or take payment. This is an evaluable workflow
MVP, not yet a production procurement system.

## Product intent

### Problem

House information is fragmented across discipline drawings, BIM models, BOQs, schedules,
merchants, mills, and specialist suppliers. Buyers need a traceable connection between a
model element, its calculated material requirement, an available product, and the work
package that consumes it. Without that connection, quantity changes and procurement
decisions are difficult to review and coordinate.

### Value proposition

- One controlled workspace for architectural, structural, MEP, specification, and IFC
  files.
- Semantic 3D selection that preserves the link from an IFC element to its takeoff.
- Formula-backed material recipes with visible quantity source, waste, assumptions,
  confidence, MOQ, stock, supplier, and price.
- Stage and dependency guidance for users who need to understand how a house is built.
- An existing marketplace, cart, and checkout surface that procurement results can enter
  immediately.
- Browser-local processing for early evaluation without requiring project-file upload to
  a backend.

### Primary users

- Contractors and site engineers planning or replenishing a residential build.
- Small builders comparing materials and suppliers.
- Home owners who need a guided list of materials for each construction stage.
- Designers and quantity reviewers validating the relationship between a model element
  and a material recommendation.

## Current implementation

| Capability                     | Status              | Notes                                                                                                                                                                                                                     |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project workspace              | Implemented locally | Project briefs and document metadata persist in `localStorage`; uploaded drawing blobs persist in IndexedDB.                                                                                                              |
| Controlled drawing register    | Implemented locally | Eleven discipline sections support multiple files, revisions, review status, approval, and not-applicable reasons.                                                                                                        |
| IFC model review               | MVP implemented     | `web-ifc` streams semantic geometry into Three.js with element selection, model summaries, and approval gates.                                                                                                            |
| Element material takeoff       | MVP implemented     | Common architectural, structural, plumbing, and electrical IFC types map to explicit recipes, MOQ-rounded catalog products, suppliers, confidence, and assumptions. Geometry-bound quantities are conservative estimates. |
| Construction SOP               | MVP implemented     | Dependency-based work packages expose drawing, model, takeoff, supplier, quality, and approval gates.                                                                                                                     |
| Marketing home page            | Implemented         | Hero, build stages, categories, featured products, and suppliers.                                                                                                                                                         |
| Product catalog                | Implemented         | Text search, category and supplier filters, and price sorting use URL search parameters.                                                                                                                                  |
| Product details                | Implemented         | Specifications, supplier link, stock, MOQ-aware quantity selection, and related products.                                                                                                                                 |
| Supplier directory             | Implemented         | Eleven static supplier profiles and their products. “Verified” is presentation data, not a live verification workflow.                                                                                                    |
| Build-stage shopping           | Implemented         | Seven stages and 38 subcategories map the catalog to a residential construction sequence.                                                                                                                                 |
| Cart                           | Implemented locally | Persists to `localStorage` under `buildyard.cart.v1`; there is no account or server-side cart.                                                                                                                            |
| Pricing summary                | Implemented locally | INR prices, ₹2,500 delivery up to ₹100,000 subtotal, free delivery above ₹100,000, and 18% GST on subtotal plus delivery.                                                                                                 |
| Checkout form                  | Demo only           | Zod validates contact and site fields. Submission generates a random `BY-xxxxxx` reference, clears the cart, and sends nothing.                                                                                           |
| Floor-plan visualiser          | Implemented locally | PNG/JPG upload, automatic raster wall detection, manual tracing, scale controls, and an orbitable Three.js model.                                                                                                         |
| SEO/error states               | Implemented         | Per-route metadata, route-specific not-found states, React error handling, and a fallback HTML 500 page.                                                                                                                  |
| Accounts, orders, and payments | Not implemented     | No authentication, database, API, payment provider, or order history.                                                                                                                                                     |
| Live stock and logistics       | Not implemented     | Stock, fulfilment, ratings, and dispatch language are static demo values.                                                                                                                                                 |

## User journeys

### IFC-led design to procurement

1. Create a project with site, building, floor, and area details.
2. Upload each drawing under its discipline heading and record its revision and status.
3. Approve the IFC revision that should be used for model review.
4. Open the 3D model and select a semantic building element.
5. Inspect its IFC identity and conservative geometry-derived dimensions, area, volume,
   or count.
6. Review the mapped material recipe, formula, waste factor, confidence, assumptions,
   supplier product, MOQ-rounded quantity, stock, and estimated price.
7. Add selected products to the existing cart and continue to checkout.
8. Review the construction SOP for work-package prerequisites and readiness.

This workflow is intentionally review-led. Derived quantities are estimates and must not
supersede approved consultant quantities or a contractual BOQ.

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

| Route                           | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `/`                             | Marketplace landing page and primary discovery entry point. |
| `/projects`                     | Browser-local design-to-procurement project list.           |
| `/projects/new`                 | Project brief and initial building setup.                   |
| `/projects/:projectId`          | Drawing, model, takeoff, supplier, and SOP readiness.       |
| `/projects/:projectId/drawings` | Categorized drawing upload, revision, and approval.         |
| `/projects/:projectId/model`    | IFC review, semantic selection, takeoff, and SOP gates.     |
| `/products`                     | Searchable and filterable materials catalog.                |
| `/products/:productId`          | Product details and add-to-cart controls.                   |
| `/suppliers`                    | Supplier directory.                                         |
| `/suppliers/:supplierId`        | Supplier profile and associated products.                   |
| `/build`                        | Ordered residential build stages.                           |
| `/build/:phaseId`               | Stage subcategories, suppliers, and products.               |
| `/cart`                         | Persistent client-side cart and calculated totals.          |
| `/checkout`                     | Validated demo delivery form and order confirmation.        |
| `/visualiser`                   | Client-side floor-plan tracing and Three.js preview.        |

Routes are file-based under `src/routes`. `src/routeTree.gen.ts` is generated by the
TanStack Router plugin and must not be edited manually.

## Architecture

```text
Project brief + drawing metadata ---- localStorage
              |
Uploaded drawings and IFC blobs ----- IndexedDB
              |
              v
       web-ifc geometry stream
              |
              v
Three.js semantic selection ---- geometry-derived quantity
                                      |
                                      v
                             material recipe engine
                                      |
                        static catalog + suppliers
                                      |
                                      v
                              cart ---- checkout
                                      |
                                      v
                         construction SOP gates
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
- `src/lib/project-store.ts` separates serializable project metadata from uploaded blobs.
  It uses versioned browser storage keys and an IndexedDB-backed file store.
- `src/lib/ifc-loader.ts` initializes `web-ifc`, loads the bundled WASM module, streams
  meshes, and exposes semantic properties for the selected express ID.
- `src/components/ifc-viewer.tsx` owns Three.js scene setup, navigation, framing,
  ray-cast selection, highlighting, progress, errors, and resource disposal.
- `src/lib/takeoff-engine.ts` maps supported IFC types and measured geometry to explicit
  material recipes, then resolves purchasable catalog products and supplier data.
- `src/lib/sop.ts` defines dependency-based construction work packages and their
  drawing, model, takeoff, procurement, quality, and approval gates.
- Route loaders for dynamic product, supplier, and phase pages perform synchronous
  lookups against local arrays and produce route-level 404s for unknown IDs.
- React Query is wired into the application context but is not currently used for
  remote queries or mutations.

### Domain data

`src/lib/project-types.ts` defines projects, discipline sections, drawing revisions,
review states, approvals, and model metadata. Eleven upload categories cover site,
architectural, structural, plumbing, electrical, HVAC, fire safety, interiors, external
works, specifications, and IFC building models.

`src/lib/takeoff-types.ts` and `src/lib/takeoff-engine.ts` define the trace from a selected
IFC element to material lines. Supported recipes cover common walls, slabs, beams,
columns, footings, roofs, doors, windows, pipes, conduits/cables, fixtures, lights, and
distribution boards. Unsupported or weakly measured elements are surfaced with reduced
confidence instead of being presented as exact quantities.

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
  components/         Project, IFC, takeoff, SOP, marketplace, and reusable UI
  hooks/              Shared React hooks
  lib/                Project storage, IFC, takeoff, SOP, catalog, cart, and utilities
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
npm install --no-package-lock
npm run dev
```

The development server is available at `http://localhost:8080` by default.

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
pass `npx tsc --noEmit`, targeted ESLint checks for changed files, and `npm run build`,
followed by manual checks of the affected route at mobile and desktop widths. The full
lint command also enforces formatting and currently exposes legacy-file issues that
predate the IFC workflow.

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
- Project and drawing data is browser-local, so it cannot yet be shared across users,
  browsers, or devices and has no server backup or audit history.
- The catalog is a large monolithic source file and has no automated integrity checks.
- The UI downloads Google Fonts at runtime; deployments with strict privacy or offline
  requirements should self-host them.
- The extracted repository contains Windows `:Zone.Identifier` metadata files. They are
  unused by the application and should be removed in a dedicated cleanup change after
  confirming they are not intentionally retained.
- The project declares no supported Node.js engine, and dependency reproducibility
  currently depends on using the committed Bun lockfile.

### IFC and visualisation

- IFC takeoff currently derives conservative measurements from rendered geometry bounds;
  it does not yet reconcile IFC base quantities, property sets, assemblies, openings,
  classifications, or an approved BOQ.
- The takeoff mapping covers common residential elements but is not a universal IFC or
  estimating rules engine. Every estimate needs human review before procurement.
- Large and highly detailed IFC files may consume significant browser memory and block
  the main thread during parsing.
- Project model selection and takeoff decisions are not yet saved as an auditable BOQ.
- Analysis is synchronous after a short timeout and may pause the UI on complex images.
- Uploaded object URLs and some rebuilt Three.js resources are not explicitly disposed,
  which may increase memory use during repeated uploads or parameter changes.
- The separate raster floor-plan visualiser cannot save or export its generated model.

## Recommended delivery roadmap

1. **Make takeoff auditable:** extract IFC base quantities and property sets, preserve
   model/revision provenance, reconcile openings and assemblies, add manual overrides,
   and export a reviewable BOQ/IFC-linked report.
2. **Persist the project domain:** add authentication, roles, object storage, project and
   document APIs, revision history, approvals, comments, and organization access.
3. **Protect the workflow:** add recipe/unit tests, catalog integrity checks, IFC fixtures,
   pricing and cart tests, route smoke tests, end-to-end coverage, and CI.
4. **Integrate live supply:** implement regional price books, supplier onboarding,
   serviceability, inventory feeds, quote comparison, substitutions, delivery planning,
   and supplier confirmations.
5. **Make checkout transactional:** validate quantities and prices server-side, reserve
   inventory, support purchase orders or payments, create idempotent orders, and retain
   an auditable order timeline.
6. **Scale model processing:** move heavy parsing to workers or a conversion service,
   support federated/large models, improve sectioning and measurements, and add model
   issue tracking and change comparison.

## Definition of production readiness

BuildYard should not be described as a live marketplace until prices and inventory are
server-authoritative, users and suppliers are authenticated, checkout creates a durable
and idempotent order, sensitive data is protected, payment/procurement and fulfilment
workflows are integrated, operational claims are backed by real processes, and the main
buyer journeys are covered by automated tests and observable in production.
