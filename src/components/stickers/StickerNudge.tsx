"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { homeFor, nextSticker } from "@/lib/stickers";
import StickerBadge from "./StickerBadge";
import HomeArt from "./HomeArt";
import { useStickers } from "./StickerBook";

/**
 * "Almost there": the closest unearned sticker among `ids` (or overall),
 * shown where the action happens, with what it would unlock.
 */
export default function StickerNudge({ ids, className }: { ids?: string[]; className?: string }) {
  const { status, stickers } = useStickers();
  if (status !== "ready") return null;
  // In the order given, so a tie goes to what fits this page best.
  const pool = ids
    ? ids.map((id) => stickers.find((s) => s.id === id)).filter((s): s is (typeof stickers)[number] => Boolean(s))
    : stickers;
  const next = nextSticker(pool);
  if (!next) return null;
  const earnedCount = stickers.filter((s) => s.earned).length;
  const home = homeFor(earnedCount);
  const unlocksHome = home.next && home.toNext === 1 ? home.next : null;
  const left = next.need - next.have;
  return (
    <Link className={className ? `sticker-nudge ${className}` : "sticker-nudge"} href={next.href}>
      <StickerBadge {...next} earned={false} size={52} />
      <span className="sticker-nudge-text">
        <strong>
          {left === next.need
            ? `Next sticker: ${next.name}`
            : `${left} more to go for ${next.name}`}
        </strong>
        <span>
          {next.how}
          {unlocksHome && ` Your home becomes a ${unlocksHome.name.toLowerCase()}.`}
        </span>
      </span>
      {unlocksHome ? <HomeArt id={unlocksHome.id} size={44} /> : <ArrowUpRight size={16} />}
    </Link>
  );
}
