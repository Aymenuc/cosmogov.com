import type { HomeId } from "@/lib/stickers";
import { homeSvg } from "./home-svg";

/** Your home illustration (static, trusted SVG; no user text inside). */
export default function HomeArt({ id, size = 72, className }: { id: HomeId; size?: number; className?: string }) {
  return (
    <span
      className={className ? `home-art ${className}` : "home-art"}
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: homeSvg(id, size) }}
    />
  );
}
