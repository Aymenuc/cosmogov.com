"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import {
  cleanCounts,
  gardenFlowers,
  homeFor,
  nextSticker,
  stickerStates,
  type StickerCounts,
  type StickerState,
} from "@/lib/stickers";
import StickerBadge from "./StickerBadge";
import GardenArt from "./GardenArt";
import HomeArt from "./HomeArt";

export type StickerHome = {
  cityName: string | null;
  countryName: string | null;
  latitude: number;
  longitude: number;
};

type Loaded = {
  status: "loading" | "ready" | "error";
  stickers: StickerState[];
  counts: StickerCounts;
  garden: { tasksDone: number; missions: number };
  home: StickerHome | null;
};

/** Ask every open sticker view (and the earning moment) to reload. */
export const STICKERS_CHANGED = "cosmogov:stickers-changed";
export function announceStickerProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STICKERS_CHANGED));
}

function readHome(value: unknown): StickerHome | null {
  if (!value || typeof value !== "object") return null;
  const h = value as Record<string, unknown>;
  const latitude = Number(h.latitude);
  const longitude = Number(h.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    cityName: typeof h.cityName === "string" ? h.cityName : null,
    countryName: typeof h.countryName === "string" ? h.countryName : null,
    latitude,
    longitude,
  };
}

/** Loads the signed-in person's sticker counts, and reloads on progress. */
export function useStickers(): Loaded & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Loaded>({
    status: "loading",
    stickers: stickerStates(null),
    counts: cleanCounts(null),
    garden: { tasksDone: 0, missions: 0 },
    home: null,
  });
  useEffect(() => {
    const reload = () => setAttempt((value) => value + 1);
    window.addEventListener(STICKERS_CHANGED, reload);
    return () => window.removeEventListener(STICKERS_CHANGED, reload);
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stickers")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const garden = data && typeof data === "object" ? data.garden : null;
        setState({
          status: "ready",
          stickers: stickerStates(data?.counts),
          counts: cleanCounts(data?.counts),
          garden: {
            tasksDone: Number(garden?.tasksDone) || 0,
            missions: Number(garden?.missions) || 0,
          },
          home: readHome(data?.home),
        });
      })
      .catch(() => {
        if (!cancelled)
          setState((current) => ({ ...current, status: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  return {
    ...state,
    retry: () => {
      setState((current) => ({ ...current, status: "loading" }));
      setAttempt((value) => value + 1);
    },
  };
}

export function GardenPanel({
  tasksDone,
  missions,
}: {
  tasksDone: number;
  missions: number;
}) {
  const { planted, extra } = gardenFlowers(tasksDone);
  return (
    <div className="garden-panel">
      <div>
        <h3>The shared garden</h3>
        <p>
          {tasksDone === 0
            ? missions === 0
              ? "Every finished task plants a flower. Start a mission to break ground."
              : "Every finished task plants a flower. The first plot is waiting."
            : `${tasksDone} ${tasksDone === 1 ? "task" : "tasks"} finished across your missions, by everyone in them.`}
          {extra > 0 && ` The bed is full; ${extra} more are growing out of frame.`}
        </p>
      </div>
      <GardenArt planted={planted} />
    </div>
  );
}

/** Your home on the desk: what it is now, and what one more sticker grows. */
function DeskHome({ earned, cityName }: { earned: number; cityName: string | null }) {
  const home = homeFor(earned);
  return (
    <Link className="desk-home" href="/dashboard/cosmic-map">
      <HomeArt id={home.current.id} size={88} />
      <span>
        <small>{cityName ? `Your home in ${cityName}` : "Your home"}</small>
        <strong>{home.current.name}</strong>
        <span>
          {!cityName
            ? "Plant your flag on the community map and watch it grow."
            : home.next
              ? `${home.toNext} more ${home.toNext === 1 ? "sticker" : "stickers"} and it becomes a ${home.next.name.toLowerCase()}.`
              : "The top of the street. You light the way."}
        </span>
      </span>
      <ArrowUpRight size={16} />
    </Link>
  );
}

/** The desk's short view: what you have, and the next one within reach. */
export function StickerStrip() {
  const { status, stickers, garden, home: homePlace, retry } = useStickers();
  const earned = stickers.filter((sticker) => sticker.earned);
  const next = nextSticker(stickers);
  const shown = [
    ...earned.slice(-4),
    ...stickers.filter((sticker) => !sticker.earned),
  ].slice(0, 5);
  return (
    <section className="desk-rewards" aria-label="Stickers and the shared garden">
      <div className="sticker-strip">
        <div className="sticker-strip-heading">
          <div>
            <h3>Your sticker book</h3>
            <p>
              {status === "loading"
                ? "Opening the book…"
                : status === "error"
                  ? "The book wouldn’t open just now."
                  : `${earned.length} of ${stickers.length} collected. For helping, never for voting.`}
            </p>
          </div>
          {status === "error" ? (
            <button className="text-link" onClick={retry}>
              Try again
            </button>
          ) : (
            <Link className="text-link" href="/dashboard/stickers">
              Open the book <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
        <ul className="sticker-row">
          {shown.map((sticker) => (
            <li key={sticker.id}>
              <StickerBadge {...sticker} size={72} />
              <span>{sticker.name}</span>
              <span className="visually-hidden">
                {sticker.earned ? ", collected" : ", not collected yet"}
              </span>
            </li>
          ))}
        </ul>
        {status === "ready" && next && (
          <Link className="sticker-next" href={next.href}>
            <strong>Next up: {next.name}</strong>
            <span>
              {next.how}
              {next.need > 1 && ` ${next.have} of ${next.need} so far.`}
            </span>
            <ArrowUpRight size={16} />
          </Link>
        )}
        {status === "ready" && !next && (
          <p className="sticker-next">
            <strong>
              <Check size={15} /> The whole book.
            </strong>
            <span>You collected every sticker there is.</span>
          </p>
        )}
      </div>
      <div className="desk-rewards-side">
        {status === "ready" && <DeskHome earned={earned.length} cityName={homePlace?.cityName ?? null} />}
        <GardenPanel tasksDone={garden.tasksDone} missions={garden.missions} />
      </div>
    </section>
  );
}
