import { categoryOrder } from "@/lib/tours/model";
import type { Dictionary } from "@/i18n/dictionaries";
import { CategoryChip } from "./CategoryChip";

/**
 * Always-present key so a colour anywhere on the page (including a map pin) can
 * be read back to a named category.
 */
export function CategoryLegend({ dict }: { dict: Dictionary }) {
  const names = dict.tours.categories as Record<string, string>;
  return (
    <ul
      aria-label={dict.tours.filters.category}
      className="flex flex-wrap items-center gap-2"
    >
      {categoryOrder.map((category) => (
        <li key={category}>
          <CategoryChip category={category} name={names[category] ?? category} />
        </li>
      ))}
    </ul>
  );
}
