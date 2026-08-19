/**
 * The Blue Mountain ridge, drawn as an inline SVG rather than an image: a small
 * brand-specific mark that stretches edge to edge and tints with currentColor.
 * A template would reach for a stock divider; this is the island's own skyline.
 */
export function RidgeLine({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        fill="currentColor"
        d="M0,80 L0,54 L70,44 L150,58 L235,30 L315,50 L400,20 L500,46 L590,28 L690,52 L790,24 L890,48 L1000,34 L1100,54 L1200,40 L1200,80 Z"
      />
    </svg>
  );
}
