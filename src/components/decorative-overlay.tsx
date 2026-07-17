import { useBgTheme, type Overlay, type OverlayColor } from "./bg-theme-context.tsx";

const COLOR_MAP: Record<OverlayColor, string> = {
  red: "rgba(220, 38, 38, 0.15)",
  purple: "rgba(168, 85, 247, 0.15)",
  blue: "rgba(59, 130, 246, 0.15)",
  green: "rgba(34, 197, 94, 0.15)",
  gold: "rgba(234, 179, 8, 0.15)",
  white: "rgba(255, 255, 255, 0.12)",
};

const STROKE_MAP: Record<OverlayColor, string> = {
  red: "rgba(220, 38, 38, 0.35)",
  purple: "rgba(168, 85, 247, 0.35)",
  blue: "rgba(59, 130, 246, 0.35)",
  green: "rgba(34, 197, 94, 0.35)",
  gold: "rgba(234, 179, 8, 0.35)",
  white: "rgba(255, 255, 255, 0.25)",
};

function HeartSvg({ color, stroke, size, x, y, rotation }: { color: string; stroke: string; size: number; x: number; y: number; rotation: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={stroke}
      strokeWidth="0.5"
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotation}deg)`, opacity: 0.7 }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BowSvg({ color, stroke, size, x, y, rotation }: { color: string; stroke: string; size: number; x: number; y: number; rotation: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill={color}
      stroke={stroke}
      strokeWidth="0.5"
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotation}deg)`, opacity: 0.6 }}
    >
      {/* Bow shape — two loops and ribbon tails */}
      <ellipse cx="14" cy="16" rx="11" ry="8" />
      <ellipse cx="26" cy="16" rx="11" ry="8" />
      <rect x="18" y="12" width="4" height="8" rx="1" fill={stroke} />
      <polygon points="18,20 14,34 20,26 26,34 22,20" fill={color} stroke={stroke} strokeWidth="0.5" />
    </svg>
  );
}

function SparkleSvg({ color, stroke, size, x, y, rotation }: { color: string; stroke: string; size: number; x: number; y: number; rotation: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={stroke}
      strokeWidth="0.3"
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotation}deg)`, opacity: 0.6 }}
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
    </svg>
  );
}

// Pseudo-random positions seeded for consistency
const POSITIONS = [
  { x: 5, y: 8, r: 15, s: 28 },
  { x: 88, y: 3, r: -20, s: 22 },
  { x: 15, y: 35, r: 40, s: 18 },
  { x: 72, y: 22, r: -10, s: 32 },
  { x: 92, y: 45, r: 25, s: 20 },
  { x: 8, y: 60, r: -35, s: 26 },
  { x: 55, y: 12, r: 50, s: 16 },
  { x: 35, y: 70, r: -15, s: 24 },
  { x: 78, y: 65, r: 30, s: 20 },
  { x: 20, y: 88, r: -45, s: 28 },
  { x: 60, y: 80, r: 10, s: 18 },
  { x: 45, y: 48, r: -25, s: 14 },
  { x: 3, y: 92, r: 20, s: 22 },
  { x: 85, y: 85, r: -30, s: 26 },
  { x: 50, y: 30, r: 35, s: 16 },
];

function renderOverlay(type: Overlay, color: string, stroke: string) {
  if (type === "none") return null;

  const Component = type === "hearts" ? HeartSvg : type === "bows" ? BowSvg : SparkleSvg;

  return POSITIONS.map((pos, i) => (
    <Component
      key={`${type}-${i}`}
      color={color}
      stroke={stroke}
      size={pos.s}
      x={pos.x}
      y={pos.y}
      rotation={pos.r}
    />
  ));
}

export default function DecorativeOverlay() {
  const { overlay, overlayColor } = useBgTheme();

  if (overlay === "none") return null;

  const fill = COLOR_MAP[overlayColor];
  const stroke = STROKE_MAP[overlayColor];

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {renderOverlay(overlay, fill, stroke)}
    </div>
  );
}
