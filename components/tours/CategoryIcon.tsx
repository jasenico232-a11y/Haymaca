import type { CategorySlug } from "@/lib/tours/model";

const paths: Record<CategorySlug, React.ReactNode> = {
  // Mountain peaks
  adventure: <path d="M3 19h18L14 6l-3.5 6-2-3L3 19Z" />,
  // Two waves
  water: (
    <>
      <path d="M3 8c2 0 2 1.6 4 1.6S9 8 11 8s2 1.6 4 1.6S17 8 19 8" />
      <path d="M3 14c2 0 2 1.6 4 1.6S9 14 11 14s2 1.6 4 1.6S17 14 19 14" />
    </>
  ),
  // Colonnade / heritage facade
  culture: (
    <>
      <path d="M4 9 12 4l8 5" />
      <path d="M6 9v8M12 9v8M18 9v8M4 20h16" />
    </>
  ),
  // Bottle (rum)
  food: (
    <>
      <path d="M10 3h4M11 3v3l-1.4 2.2A3 3 0 0 0 9 9.9V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9.9a3 3 0 0 0-.6-1.7L13 6V3" />
      <path d="M9 13h6" />
    </>
  ),
  // Leaf
  wildlife: (
    <>
      <path d="M20 4C10 4 4 9 4 17c0 1 0 2 .5 3C6 13 12 9 19 8c-4 2-8 4-10 9" />
    </>
  ),
};

export function CategoryIcon({
  category,
  className,
}: {
  category: CategorySlug;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[category]}
    </svg>
  );
}
