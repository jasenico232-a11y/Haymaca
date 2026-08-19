import type { TourView } from "@/lib/tours/view";
import { TourCard } from "./TourCard";

export function TourGrid({ views }: { views: TourView[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      {views.map((view) => (
        <li key={view.slug} className="h-full">
          <TourCard view={view} />
        </li>
      ))}
    </ul>
  );
}
