"use client";
import { useEffect, useRef } from "react";
import StepArt, { type StepArtName } from "./StepArt";

const stops: {
  art: StepArtName;
  tint: "sky" | "mint" | "peach" | "lilac" | "sun" | "paper";
  who: string;
  title: string;
  copy: string;
  noteLabel: string;
  note: string;
}[] = [
  {
    art: "goal",
    tint: "sky",
    who: "You and your people",
    title: "Bring a goal worth working on.",
    copy: "Name it in a sentence. Then add what you already know: a source, a limit, a point of view.",
    noteLabel: "Good to know",
    note: "A private mission stays with you. A shared one belongs to your community.",
  },
  {
    art: "scout",
    tint: "mint",
    who: "Scout · research",
    title: "Find what’s known. Flag what isn’t.",
    copy: "Scout reads what people added and pulls out what the sources support. Everything else goes on a list of questions to check.",
    noteLabel: "House rule",
    note: "No invented sources. A draft that cites something nobody added is rejected.",
  },
  {
    art: "bridge",
    tint: "peach",
    who: "Bridge · perspectives",
    title: "Lay every view side by side.",
    copy: "Bridge maps the perspectives and limits people actually shared, and keeps the disagreements visible.",
    noteLabel: "House rule",
    note: "No guessing what someone thinks. Silence is not agreement.",
  },
  {
    art: "maker",
    tint: "lilac",
    who: "Maker · a plan",
    title: "Turn it into tasks people can pick up.",
    copy: "Maker drafts a short list of practical tasks, each with a rough effort estimate, starting with whatever still needs checking.",
    noteLabel: "House rule",
    note: "No assigning people, no spending money, no contacting anyone.",
  },
  {
    art: "studio",
    tint: "sun",
    who: "Studio · a form",
    title: "Build the form your mission needs.",
    copy: "A skills board, an equipment pledge, a quick survey. Studio drafts it; your community fills it in.",
    noteLabel: "House rule",
    note: "A form is a short list of questions. Never code, and no asking for private details.",
  },
  {
    art: "decide",
    tint: "paper",
    who: "You and your people",
    title: "You decide what joins the mission.",
    copy: "A plan becomes tasks and a form goes live only when a person adopts it. Drafts can be wrong, which is why people review them.",
    noteLabel: "Always",
    note: "If people add something new, an older draft must be run again before it can be adopted.",
  },
];

/**
 * How a mission moves, as a path the visitor walks by scrolling. The line is
 * drawn by scroll position; each stop settles in once. Without JavaScript, or
 * with reduced motion, everything is simply shown.
 */
export default function MissionPath() {
  const root = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = root.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    list.classList.add("is-enhanced");
    let frame = 0;
    let drawn = 0;
    const draw = () => {
      frame = 0;
      const box = list.getBoundingClientRect();
      // The trail only ever grows: scrolling back up does not erase it.
      drawn = Math.max(
        drawn,
        Math.min(1, (window.innerHeight * 0.72 - box.top) / box.height),
      );
      list.style.setProperty("--path-draw", String(drawn));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-reached");
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: "0px 0px -22% 0px", threshold: 0.25 },
    );
    list.querySelectorAll(".path-stop").forEach((stop) => observer.observe(stop));
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      list.classList.remove("is-enhanced");
    };
  }, []);
  return (
    <ol className="mission-path" ref={root}>
      {stops.map((stop, index) => (
        <li
          key={stop.art}
          className={`path-stop ${index % 2 ? "flip" : ""}`}
        >
          <div className={`path-art tint-${stop.tint}`}>
            <StepArt name={stop.art} />
          </div>
          <div className="path-card">
            <span className={`path-who tint-${stop.tint}`}>{stop.who}</span>
            <h3>{stop.title}</h3>
            <p>{stop.copy}</p>
          </div>
          <p className="path-note">
            <strong>{stop.noteLabel}</strong>
            {stop.note}
          </p>
        </li>
      ))}
    </ol>
  );
}
