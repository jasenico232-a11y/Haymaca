import {
  COASTLINE_COARSE,
  COASTLINE_DETAIL,
  ISLAND_VIEWBOX,
  project,
} from "@/lib/geo/jamaica";

type Point = { coords: [number, number]; color: string };

// Pin radii in viewBox units (the island is 1000 wide). A 110px thumbnail
// shows the island at a ninth of its viewBox size, so its pin is drawn larger.
const PIN = {
  sm: { dot: 44, ring: 12, halo: 96, stroke: 5 },
  md: { dot: 24, ring: 8, halo: 54, stroke: 3 },
  lg: { dot: 17, ring: 6, halo: 42, stroke: 2 },
} as const;

/**
 * A small "where on the island" drawing: the real coastline with one or more
 * points on it. Stands in the media slot of tour cards, destinations and the
 * booking summary until location photography exists, and carries information
 * a stock landscape could not: where the day actually starts.
 */
export function Locator({
  points,
  label,
  tint,
  detail = false,
  size = "md",
  className,
}: {
  points: Point[];
  /** Accessible name. Leave out when the drawing is decoration. */
  label?: string;
  /** Hex for the sea wash behind the island; defaults to the first point. */
  tint?: string;
  /** Use the 1:10m coastline (larger renders) instead of the 1:50m one. */
  detail?: boolean;
  /** Rendered width class: the pin grows as the drawing shrinks so it reads. */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pin = PIN[size];
  const wash = tint ?? points[0]?.color ?? "#2E7D8C";
  return (
    <svg
      viewBox={ISLAND_VIEWBOX}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <rect
        x="-200"
        y="-200"
        width="1400"
        height="820"
        fill={wash}
        fillOpacity="0.07"
      />
      <path
        d={detail ? COASTLINE_DETAIL : COASTLINE_COARSE}
        fill="#FBFAF6"
        stroke={wash}
        strokeOpacity="0.45"
        strokeWidth={pin.stroke}
        strokeLinejoin="round"
      />
      {points.map((point) => {
        const [x, y] = project(point.coords);
        return (
          <g key={`${x}-${y}`}>
            <circle
              cx={x}
              cy={y}
              r={pin.halo}
              fill={point.color}
              fillOpacity="0.16"
            />
            <circle
              cx={x}
              cy={y}
              r={pin.dot}
              fill={point.color}
              stroke="#FBFAF6"
              strokeWidth={pin.ring}
            />
          </g>
        );
      })}
    </svg>
  );
}
