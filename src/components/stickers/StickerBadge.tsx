import {
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  Eye,
  Hammer,
  Hand,
  Home,
  Megaphone,
  MessageCircle,
  Sparkles,
  Stamp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { StickerShape, StickerTint } from "@/lib/stickers";

const icons: Record<string, LucideIcon> = {
  spark: Sparkles,
  people: Users,
  home: Home,
  book: BookOpen,
  eye: Eye,
  hand: Hand,
  check: CheckCheck,
  hammer: Hammer,
  form: ClipboardCheck,
  stamp: Stamp,
  megaphone: Megaphone,
  comment: MessageCircle,
};

/** A star with `points` tips, as an SVG path. */
function burst(points: number, outer: number, inner: number) {
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const x = 50 + r * Math.sin(i * step);
    const y = 50 - r * Math.cos(i * step);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/** A flower-edged circle with `lobes` bumps. */
function scallop(lobes: number, radius: number, bump: number) {
  const step = (Math.PI * 2) / lobes;
  let d = "";
  for (let i = 0; i <= lobes; i++) {
    const x = 50 + radius * Math.sin(i * step);
    const y = 50 - radius * Math.cos(i * step);
    d += i
      ? `A${bump} ${bump} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`
      : `M${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

const shapes: Record<StickerShape, string> = {
  circle: "M50 7a43 43 0 1 1 0 86 43 43 0 0 1 0-86Z",
  square:
    "M30 8h40a22 22 0 0 1 22 22v40a22 22 0 0 1-22 22H30A22 22 0 0 1 8 70V30A22 22 0 0 1 30 8Z",
  hexagon: "M50 6 88 28v44L50 94 12 72V28Z",
  shield: "M50 6 88 20v30c0 24-16 38-38 44C28 88 12 74 12 50V20Z",
  burst: burst(12, 46, 37),
  scallop: scallop(10, 38, 13),
};

/**
 * One sticker. Earned stickers are printed in colour with an ink edge and a
 * solid shadow; ones still to earn are an empty dashed outline, like the
 * space left for them in a sticker book.
 */
export default function StickerBadge({
  shape,
  tint,
  icon,
  earned,
  size = 88,
}: {
  shape: StickerShape;
  tint: StickerTint;
  icon: string;
  earned: boolean;
  size?: number;
}) {
  const Icon = icons[icon] || Sparkles;
  return (
    <span
      className={`sticker tint-${tint} ${earned ? "earned" : "empty"}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="-4 -4 112 112" fill="none" focusable="false">
        {earned && (
          <path
            className="sticker-shadow"
            d={shapes[shape]}
            transform="translate(4 5)"
            strokeLinejoin="round"
          />
        )}
        <path
          className="sticker-shape"
          d={shapes[shape]}
          strokeLinejoin="round"
        />
        {earned && <circle className="sticker-inner" cx="50" cy="50" r="26" />}
      </svg>
      <Icon size={Math.round(size * 0.34)} strokeWidth={2.2} />
    </span>
  );
}
