import { categoryAccent, type CategorySlug } from "@/lib/tours/model";
import { CategoryIcon } from "./CategoryIcon";

/**
 * Category tag. Colour never travels alone: the hue rides on the icon while the
 * name is always spelled out in readable ink alongside it.
 */
export function CategoryChip({
  category,
  name,
  className,
}: {
  category: CategorySlug;
  name: string;
  className?: string;
}) {
  const accent = categoryAccent[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2 py-1 text-xs font-medium text-ink ${accent.chip} ${className ?? ""}`}
    >
      <CategoryIcon category={category} className={`h-4 w-4 ${accent.icon}`} />
      {name}
    </span>
  );
}
