"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  homeFor,
  stickerImpact,
  stickerStates,
  type StickerCounts,
  type StickerState,
} from "@/lib/stickers";
import StickerBadge from "./StickerBadge";
import HomeArt from "./HomeArt";
import { STICKERS_CHANGED } from "./StickerBook";

/**
 * The earning moment. When a person's own actions earn a sticker, it is
 * celebrated once, wherever they are in the workspace: confetti, the sticker
 * peeling on, what it stands for, and what it unlocked (their home grows).
 *
 * "Already celebrated" is remembered per browser; that is a convenience, not a
 * record. On the very first visit everything already earned is marked as seen
 * quietly, so nobody gets a burst of old news.
 */

const SEEN_KEY = "cosmogov:stickers-celebrated:v1";
const MIN_GAP_MS = 4000;

type Moment = {
  sticker: StickerState;
  impact: string;
  grewInto: ReturnType<typeof homeFor>["current"] | null;
};

function readSeen(): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v) => typeof v === "string")) : null;
  } catch {
    return null;
  }
}

function writeSeen(ids: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable: celebrations may repeat, nothing breaks */
  }
}

const CONFETTI = ["#6741D9", "#FF785F", "#FFCF4D", "#28745B", "#226784", "#EEE6FF"];

export default function StickerCelebration() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<Moment[]>([]);
  const lastCheck = useRef(0);
  const primaryRef = useRef<HTMLAnchorElement>(null);

  const check = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheck.current < MIN_GAP_MS) return;
    lastCheck.current = now;
    try {
      const res = await fetch("/api/stickers", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const counts = data?.counts as StickerCounts | undefined;
      const garden = { tasksDone: Number(data?.garden?.tasksDone) || 0 };
      const states = stickerStates(counts);
      const earned = states.filter((s) => s.earned);
      const seen = readSeen();
      if (!seen) {
        writeSeen(new Set(earned.map((s) => s.id)));
        return;
      }
      const fresh = earned.filter((s) => !seen.has(s.id));
      if (!fresh.length) return;
      const before = earned.length - fresh.length;
      const moments: Moment[] = fresh.map((sticker, i) => {
        const prior = homeFor(before + i).current;
        const after = homeFor(before + i + 1).current;
        return {
          sticker,
          impact: stickerImpact(sticker.id, counts, garden),
          grewInto: after.id !== prior.id ? after : null,
        };
      });
      fresh.forEach((s) => seen.add(s.id));
      writeSeen(seen);
      setQueue((current) => [...current, ...moments]);
    } catch {
      /* offline or signed out: try again on the next page */
    }
  }, []);

  useEffect(() => {
    // After the page has painted: a sticker check never delays navigation.
    const timer = window.setTimeout(() => void check(), 600);
    return () => window.clearTimeout(timer);
  }, [pathname, check]);

  useEffect(() => {
    const onFocus = () => check();
    const onProgress = () => check(true);
    window.addEventListener("focus", onFocus);
    window.addEventListener(STICKERS_CHANGED, onProgress);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(STICKERS_CHANGED, onProgress);
    };
  }, [check]);

  const moment = queue[0];
  const close = useCallback(() => setQueue((current) => current.slice(1)), []);

  useEffect(() => {
    if (!moment) return;
    primaryRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moment, close]);

  if (!moment) return null;
  const { sticker, impact, grewInto } = moment;
  const showMap = sticker.id === "on-the-map" || grewInto;

  return (
    <div className="celebration-backdrop" onClick={close}>
      <div className="celebration-confetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 7) * 0.08}s`,
              transform: `rotate(${(i * 47) % 360}deg)`,
            }}
          />
        ))}
      </div>
      <div
        className="celebration-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="celebration-close" onClick={close} aria-label="Close">
          <X size={18} />
        </button>
        <p className="celebration-eyebrow">New sticker for your book</p>
        <div className="celebration-sticker">
          <StickerBadge {...sticker} earned size={148} />
        </div>
        <h2 id="celebration-title">{sticker.name}!</h2>
        {impact && <p className="celebration-impact">{impact}</p>}
        {grewInto && (
          <div className="celebration-unlock">
            <HomeArt id={grewInto.id} size={64} />
            <div>
              <strong>Your home grew into a {grewInto.name.toLowerCase()}.</strong>
              <span>{grewInto.line}</span>
            </div>
          </div>
        )}
        <div className="celebration-actions">
          <Link
            ref={primaryRef}
            className="celebration-primary"
            href={showMap ? "/dashboard/cosmic-map" : "/dashboard/stickers"}
            onClick={close}
          >
            {showMap ? "See your home on the map" : "Open my sticker book"}
          </Link>
          <button className="celebration-secondary" onClick={close}>
            {queue.length > 1 ? "Next one" : "Keep going"}
          </button>
        </div>
        <p className="celebration-note">For helping, never for voting.</p>
      </div>
    </div>
  );
}
