import type { Category } from "./catalog";

import cement from "@/assets/cat-cement.jpg";
import steel from "@/assets/cat-steel.jpg";
import timber from "@/assets/cat-timber.jpg";
import bricks from "@/assets/cat-bricks.jpg";
import aggregates from "@/assets/cat-aggregates.jpg";
import tools from "@/assets/cat-tools.jpg";
import plumbing from "@/assets/cat-plumbing.jpg";
import electrical from "@/assets/cat-electrical.jpg";
import flooring from "@/assets/cat-flooring.jpg";
import paint from "@/assets/cat-paint.jpg";
import interiors from "@/assets/cat-interiors.jpg";

export const CATEGORY_IMAGES: Record<Category, string> = {
  "Cement & Concrete": cement,
  "Steel & Rebar": steel,
  "Timber & Boards": timber,
  "Bricks & Blocks": bricks,
  Aggregates: aggregates,
  "Tools & Safety": tools,
  Plumbing: plumbing,
  Electrical: electrical,
  "Flooring & Tiles": flooring,
  "Paint & Finishes": paint,
  "Interiors & Fittings": interiors,
};
