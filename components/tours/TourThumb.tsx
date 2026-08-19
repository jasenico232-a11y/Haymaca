/**
 * A branded landscape motif, drawn per tour rather than shot. Layered ridges in
 * the category colour, seeded off the slug so each tour reads differently — the
 * same island line as the home-page RidgeLine, not a stock photo. Real
 * photography would replace this; the card layout does not change when it does.
 */
const RIDGES: Array<[string, string, string]> = [
  [
    "M0,150 L60,120 L130,140 L210,105 L300,135 L360,115 L400,130 L400,300 L0,300 Z",
    "M0,200 L80,170 L160,195 L240,160 L320,190 L400,170 L400,300 L0,300 Z",
    "M0,250 L70,230 L150,250 L250,225 L340,248 L400,235 L400,300 L0,300 Z",
  ],
  [
    "M0,135 L90,150 L160,110 L250,140 L330,110 L400,140 L400,300 L0,300 Z",
    "M0,190 L70,175 L150,200 L230,170 L310,198 L400,180 L400,300 L0,300 Z",
    "M0,245 L80,255 L170,232 L260,252 L350,235 L400,250 L400,300 L0,300 Z",
  ],
  [
    "M0,145 L70,130 L140,150 L200,115 L280,150 L350,120 L400,140 L400,300 L0,300 Z",
    "M0,195 L90,205 L170,175 L250,205 L330,180 L400,200 L400,300 L0,300 Z",
    "M0,255 L60,240 L160,258 L240,238 L330,256 L400,242 L400,300 L0,300 Z",
  ],
  [
    "M0,125 L80,145 L150,120 L230,150 L320,120 L400,145 L400,300 L0,300 Z",
    "M0,185 L70,200 L160,178 L250,202 L340,182 L400,198 L400,300 L0,300 Z",
    "M0,248 L90,235 L180,255 L270,235 L360,252 L400,240 L400,300 L0,300 Z",
  ],
];

function seedIndex(seed: string): number {
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return total % RIDGES.length;
}

export function TourThumb({
  title,
  color,
  seed,
  className,
}: {
  title: string;
  color: string;
  seed: string;
  className?: string;
}) {
  const [far, mid, near] = RIDGES[seedIndex(seed)]!;
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="0" y="0" width="400" height="300" fill="#FBFAF6" />
      <circle cx="322" cy="74" r="30" fill={color} fillOpacity="0.85" />
      <path d={far} fill={color} fillOpacity="0.2" />
      <path d={mid} fill={color} fillOpacity="0.38" />
      <path d={near} fill={color} fillOpacity="0.7" />
    </svg>
  );
}
