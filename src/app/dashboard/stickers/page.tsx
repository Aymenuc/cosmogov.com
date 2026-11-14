"use client";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import StickerBadge from "@/components/stickers/StickerBadge";
import { GardenPanel, useStickers } from "@/components/stickers/StickerBook";

export default function StickerBookPage() {
  const { status, stickers, garden, retry } = useStickers();
  const earned = stickers.filter((sticker) => sticker.earned).length;
  return (
    <div className="sticker-book">
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> SMALL THANKS FOR REAL HELP
          </div>
          <h1>Your sticker book.</h1>
          <p>
            {status === "ready"
              ? `${earned} of ${stickers.length} collected.`
              : status === "loading"
                ? "Opening the book…"
                : "The book wouldn’t open just now."}{" "}
            Each one marks something you did that helped.
          </p>
        </div>
        <Link href="/dashboard/missions" className="civic-button">
          Start a mission <ArrowUpRight size={16} />
        </Link>
      </div>
      {status === "error" && (
        <div className="empty-state" role="alert">
          <p>Your sticker book couldn’t be loaded. Please try again.</p>
          <button className="civic-button outline" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      <GardenPanel tasksDone={garden.tasksDone} missions={garden.missions} />
      <ul className="sticker-grid">
        {stickers.map((sticker) => (
          <li key={sticker.id} className={sticker.earned ? "earned" : ""}>
            <StickerBadge {...sticker} size={96} />
            <h2>{sticker.name}</h2>
            <p>{sticker.how}</p>
            {sticker.earned ? (
              <span className="sticker-state">
                <Check size={14} /> Collected
              </span>
            ) : (
              <Link className="sticker-state" href={sticker.href}>
                {sticker.need > 1
                  ? `${sticker.have} of ${sticker.need}`
                  : "Go and get it"}
                <ArrowUpRight size={14} />
              </Link>
            )}
          </li>
        ))}
      </ul>
      <section className="sticker-rules">
        <h2>How stickers work</h2>
        <ul>
          <li>
            <strong>They are for helping.</strong> Starting something, sharing
            what you know, picking up a task, finishing it.
          </li>
          <li>
            <strong>There are none for voting or signing.</strong> A vote
            should never earn anything, so it doesn’t.
          </li>
          <li>
            <strong>They don’t rank anyone.</strong> Stickers are not on any
            leaderboard and unlock nothing. Your book is only shown to you.
          </li>
          <li>
            <strong>Each one follows a fixed rule</strong> over your own
            activity, so you can always see why you have it.
          </li>
        </ul>
      </section>
    </div>
  );
}
