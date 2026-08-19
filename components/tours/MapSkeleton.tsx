/**
 * Fills the map container exactly (absolute inset-0 inside the fixed-height
 * frame in TourMapLoader), so the real map drops in with zero layout shift.
 */
export function MapSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 overflow-hidden bg-line/40"
    >
      {/* faint grid to read as a map while tiles load */}
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-pulse opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(#E0DDD3 1px, transparent 1px), linear-gradient(90deg, #E0DDD3 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-control border border-line bg-paper px-3 py-1 text-sm text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
