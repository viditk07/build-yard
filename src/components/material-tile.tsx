import {
  Blocks,
  Boxes,
  Hammer,
  Layers,
  Mountain,
  Ruler,
  Droplets,
  Zap,
  Grid2x2,
  PaintRoller,
  Sofa,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/catalog";
import { CATEGORY_IMAGES } from "@/lib/category-images";


const ICONS: Record<Category, LucideIcon> = {
  "Cement & Concrete": Layers,
  "Steel & Rebar": Ruler,
  "Timber & Boards": Boxes,
  "Bricks & Blocks": Blocks,
  Aggregates: Mountain,
  "Tools & Safety": Hammer,
  Plumbing: Droplets,
  Electrical: Zap,
  "Flooring & Tiles": Grid2x2,
  "Paint & Finishes": PaintRoller,
  "Interiors & Fittings": Sofa,
};


export function CategoryIcon({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const Icon = ICONS[category] ?? Blocks;
  return <Icon className={className} strokeWidth={1.4} aria-hidden="true" />;
}

export function MaterialTile({
  category,
  className = "",
}: {
  category: Category;
  className?: string;
}) {
  const src = CATEGORY_IMAGES[category];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-secondary ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={`${category} materials`}
          width={768}
          height={512}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <CategoryIcon
          category={category}
          className="relative size-12 text-muted-foreground"
        />
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}

