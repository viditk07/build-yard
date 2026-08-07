# BuildYard

BuildYard is an IFC-first design-to-procurement prototype for Indian contractors,
builders, site engineers, and home owners. Users can organize a controlled drawing set,
inspect a semantic 3D building model, turn selected elements into traceable material
requirements, compare suppliers, and follow a construction SOP.

> [!NOTE]
> BuildYard is currently a browser-persistent MVP. Project files are stored locally in
> IndexedDB, catalog data is static, and checkout does not create a server-side order or
> take payment.

## Features

- Create house projects with site, building, area, floor, and construction details.
- Upload drawings under 11 discipline-specific sections with metadata and revisions.
- Review and approve architectural, structural, plumbing, electrical, IFC, and other
  project documents.
- Load IFC models in the browser and select semantic building elements in 3D.
- Convert selected walls, slabs, structural elements, openings, and MEP elements into
  formula-backed material requirements with confidence and assumptions.
- Match material requirements to supplier products, stock, MOQ, and estimated cost.
- Track construction work-package readiness through a dependency-based SOP.
- Search and filter 63 products across 11 construction-material categories.
- Browse 11 supplier profiles with product, location, rating, and fulfilment details.
- Shop through seven residential build stages, from foundation to interior fit-out.
- Review product specifications, stock, trade units, prices, and minimum order quantities.
- Persist the cart locally and calculate delivery, GST, and order totals.
- Validate delivery details through a demo checkout flow.
- Upload a floor-plan image, detect or manually trace walls, and preview them in 3D.
- Render route-specific metadata, not-found pages, and resilient server error states.
- Navigate through a responsive, collapsible marketplace interface.

## Technology stack

- [React 19](https://react.dev/) and TypeScript
- [TanStack Start](https://tanstack.com/start) and TanStack Router
- [Vite](https://vite.dev/) and Nitro
- [Tailwind CSS 4](https://tailwindcss.com/)
- Radix UI and shadcn-style components
- [Three.js](https://threejs.org/) for IFC and floor-plan 3D rendering
- `web-ifc` for semantic IFC parsing and geometry streaming
- Zod for checkout validation
- Lucide icons and Sonner notifications

## Getting started

### Prerequisites

- Node.js with npm, or Bun
- A modern browser with WebGL support for the 3D visualiser

No environment variables or external services are required for the current prototype.

### Install and run

The committed `bun.lock` is the canonical dependency lockfile.

```sh
# Bun
bun install
bun run dev
```

Alternatively, with npm:

```sh
npm install --no-package-lock
npm run dev
```

Open [http://localhost:8080](http://localhost:8080), or use the local URL printed by
Vite if port 8080 is unavailable.

### Try the design-to-procurement workflow

1. Open **Projects** and create a house project.
2. Upload drawings into the relevant discipline sections. Add an `.ifc` model under
   **IFC building model**.
3. Review the register and approve the IFC revision that should drive takeoff.
4. Open the model workspace, orbit the model, and select a building element.
5. Review the element metadata, derived quantities, material recipe, assumptions,
   supplier product, MOQ rounding, stock, and price.
6. Add the required products to the cart and continue to the demo checkout.
7. Use the SOP panel to see work-package dependencies and readiness gates.

## Available commands

| Command             | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite development server.    |
| `npm run build`     | Create a production SSR build.        |
| `npm run build:dev` | Build using development mode.         |
| `npm run preview`   | Preview the production build locally. |
| `npm run lint`      | Run ESLint and Prettier checks.       |
| `npm run format`    | Format the repository with Prettier.  |

Equivalent commands can be run with `bun run`. There is currently no automated test
suite. Changes should at minimum pass `npx tsc --noEmit`, targeted lint for the changed
files, and `npm run build`, followed by manual checks of affected routes at mobile and
desktop widths. The repository-wide lint command also checks formatting and currently
reports legacy-file issues outside the new project workflow.

## Main routes

| Route                           | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `/`                             | Marketplace home and featured discovery.               |
| `/projects`                     | Design-to-procurement project list.                    |
| `/projects/new`                 | Project setup and building brief.                      |
| `/projects/:projectId`          | Project readiness and workflow dashboard.              |
| `/projects/:projectId/drawings` | Categorized drawing upload and approval workspace.     |
| `/projects/:projectId/model`    | IFC review, element takeoff, suppliers, and SOP gates. |
| `/products`                     | Searchable and filterable materials catalog.           |
| `/products/:productId`          | Product specifications and cart controls.              |
| `/suppliers`                    | Supplier directory.                                    |
| `/suppliers/:supplierId`        | Supplier profile and products.                         |
| `/build`                        | Residential construction stages.                       |
| `/build/:phaseId`               | Materials grouped by stage subcategory.                |
| `/cart`                         | Cart quantities and pricing summary.                   |
| `/checkout`                     | Validated demo checkout.                               |
| `/visualiser`                   | Browser-based floor-plan tracing and 3D preview.       |

## Project structure

```text
src/
  assets/             Marketplace and category imagery
  components/         Application chrome, product UI, and UI primitives
  hooks/              Shared React hooks
  lib/                Catalog, phases, cart, plan tracing, and error handling
  routes/             TanStack file routes
  routeTree.gen.ts    Generated route manifest
  router.tsx          Router and query-client setup
  server.ts           SSR server-entry wrapper
  start.ts            TanStack Start middleware
  styles.css          Theme tokens and Tailwind utilities
public/                Static browser assets
```

The application uses file-based routing. Do not edit `src/routeTree.gen.ts` manually;
the TanStack Router plugin regenerates it from `src/routes`.

## Current limitations

- Projects and uploaded files currently persist only in the current browser.
- IFC quantities are conservative geometry-bound estimates; consultant quantities and an
  approved BOQ must supersede them before real procurement.
- Products, suppliers, prices, stock, ratings, and fulfilment details are static demo data.
- There is no database, authentication, API, supplier portal, or inventory integration.
- The cart exists only in `localStorage` on the current browser.
- Checkout creates a random local reference and does not persist, notify, invoice, or
  charge an order.
- Floor-plan detection is a visual approximation rather than a CAD or BIM parser.
- Automated tests and CI are not yet configured.

See [PROJECT.md](./PROJECT.md) for the full product brief, architecture, pricing rules,
known risks, and recommended delivery roadmap.

## Working with Lovable

This repository is connected to [Lovable](https://lovable.dev). Commits pushed to the
connected branch sync back to the Lovable editor.

> [!IMPORTANT]
> Do not force-push, rebase, amend, or squash commits that have already been pushed.
> Rewriting published history can cause project history to be lost on Lovable's side.

The Lovable Vite preset already configures TanStack Start, React, Tailwind, Nitro,
development tools, and path aliases. Do not add duplicate versions of those plugins to
`vite.config.ts`.

## License

No license file is currently included. Unless a license is added, the repository should
be treated as all rights reserved.
