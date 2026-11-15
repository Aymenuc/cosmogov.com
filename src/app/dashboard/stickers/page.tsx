"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Lock, ScrollText } from "lucide-react";
import StickerBadge from "@/components/stickers/StickerBadge";
import HomeArt from "@/components/stickers/HomeArt";
import { GardenPanel, useStickers } from "@/components/stickers/StickerBook";
import { homeFor, homeLevels, stickerImpact } from "@/lib/stickers";

export default function StickerBookPage() {
  const { status, stickers, counts, garden, home: homePlace, retry } = useStickers();
  const earned = stickers.filter((sticker) => sticker.earned).length;
  const home = homeFor(earned);
  const progress = home.next
    ? Math.round(((earned - home.current.from) / (home.next.from - home.current.from)) * 100)
    : 100;
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
            Each one marks something you did that helped, and each one makes your home grow.
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

      <section className="home-hero" aria-labelledby="home-hero-title">
        <HomeArt id={home.current.id} size={150} className="home-hero-art" />
        <div className="home-hero-text">
          <p className="home-hero-eyebrow">
            Your home{homePlace?.cityName ? ` in ${homePlace.cityName}` : ""}
          </p>
          <h2 id="home-hero-title">{home.current.name}</h2>
          <p>{home.current.line}</p>
          {home.next ? (
            <>
              <div className="home-progress" aria-hidden="true">
                <span style={{ width: `${Math.max(6, progress)}%` }} />
              </div>
              <p className="home-next">
                {home.toNext === 1 ? "One more sticker" : `${home.toNext} more stickers`} and it becomes a{" "}
                <strong>{home.next.name.toLowerCase()}</strong>.
              </p>
            </>
          ) : (
            <p className="home-next">
              <strong>The top of the street.</strong> You collected enough to light the way.
            </p>
          )}
          <div className="home-hero-actions">
            <Link className="civic-button" href="/dashboard/cosmic-map">
              {homePlace ? "See it on the map" : "Plant your flag on the map"} <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <ol className="home-ladder" aria-label="Homes you can grow into">
          {homeLevels.map((level) => {
            const reached = earned >= level.from;
            return (
              <li key={level.id} className={reached ? "reached" : ""}>
                <HomeArt id={level.id} size={52} />
                <span>{level.name}</span>
                <small>
                  {reached ? (
                    <>
                      <Check size={12} /> yours
                    </>
                  ) : (
                    <>
                      <Lock size={11} /> at {level.from}
                    </>
                  )}
                </small>
              </li>
            );
          })}
        </ol>
      </section>

      <Link className="record-callout" href="/dashboard/record">
        <ScrollText size={28} />
        <span>
          <strong>Your civic record</strong>
          <span>
            A printable record of everything you’ve done here, with dates and estimated time. Use it for school,
            a CV or a volunteering form.
          </span>
        </span>
        <ArrowUpRight size={18} />
      </Link>

      <GardenPanel tasksDone={garden.tasksDone} missions={garden.missions} />
      <ul className="sticker-grid">
        {stickers.map((sticker) => (
          <li key={sticker.id} className={sticker.earned ? "earned" : ""}>
            <StickerBadge {...sticker} size={96} />
            <h2>{sticker.name}</h2>
            <p>{sticker.earned ? stickerImpact(sticker.id, counts, garden) : sticker.how}</p>
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
            <strong>They grow things for you, never your say.</strong> Your home on the
            map grows and your civic record fills in. No sticker gives you a bigger
            voice in any decision.
          </li>
          <li>
            <strong>They don’t rank anyone.</strong> Stickers are on no leaderboard,
            and your book and your home are only shown to you.
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
