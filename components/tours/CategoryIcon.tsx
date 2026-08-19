import type { CategorySlug } from "@/lib/tours/model";

const paths: Record<CategorySlug, React.ReactNode> = {
  // Falling water into a pool
  waterfalls: (
    <>
      <path d="M8 4v7M12 4v7M16 4v7" />
      <path d="M4 16c2 0 2 1.5 4 1.5S12 16 14 16s2 1.5 4 1.5" />
      <path d="M4 20c2 0 2 1.5 4 1.5S12 20 14 20s2 1.5 4 1.5" />
    </>
  ),
  // Sailboat
  "beach-boat": (
    <>
      <path d="M3 18h18l-2.2 3H5.2L3 18Z" />
      <path d="M12 3v12M12 5l6.5 9.5H12" />
    </>
  ),
  // Music notes
  "music-culture": (
    <>
      <path d="M9 17V6l10-2v9" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="15" r="2" />
    </>
  ),
  // Mountain peaks
  "blue-mountain": <path d="M3 19h18L14 6l-3.5 6-2-3L3 19Z" />,
  // Rum bottle
  "food-rum": (
    <>
      <path d="M10 3h4M11 3v3l-1.4 2.2A3 3 0 0 0 9 9.9V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9.9a3 3 0 0 0-.6-1.7L13 6V3" />
      <path d="M9 13h6" />
    </>
  ),
  // Anchor
  charters: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v13" />
      <path d="M6 13a6 6 0 0 0 12 0" />
      <path d="M6 13H4M18 13h2" />
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
