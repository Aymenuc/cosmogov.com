import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Plus } from "lucide-react";
import ToolArt, { type ToolArtName } from "./ToolArt";
import { toolLooks } from "./tool-looks";
import StickerNudge from "./stickers/StickerNudge";

export default function WorkspaceHeading({
  title,
  description,
  back,
  look,
  children,
}: {
  title: string;
  description: string;
  back?: { href: string; label: string };
  /** Gives the section its own face: tint, headline, illustration, reason to take part. */
  look?: ToolArtName;
  children?: ReactNode;
}) {
  const backLink = back && (
    <Link href={back.href} className="workspace-back-link">
      <ArrowLeft size={16} aria-hidden="true" /> {back.label}
    </Link>
  );

  if (!look) {
    return (
      <header className="workspace-heading">
        {backLink}
        <div className="app-page-heading">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </div>
      </header>
    );
  }

  const identity = toolLooks[look];
  return (
    <header className={`workspace-heading tool-hero tint-${identity.tint}`} data-look={look}>
      {backLink}
      <div className="tool-hero-panel">
        <div className="tool-hero-text">
          <span className="tool-hero-eyebrow">{title}</span>
          <h1>{identity.headline}</h1>
          <p>{description}</p>
          {children && <div className="tool-hero-actions">{children}</div>}
        </div>
        <ToolArt name={look} className="tool-hero-art" />
      </div>
      <div className="tool-hero-why">
        <p className="tool-hero-cheer">
          <Heart size={15} aria-hidden="true" /> {identity.cheer}
        </p>
        {identity.nudge && (
          <StickerNudge
            className="tool-hero-nudge"
            ids={identity.nudge === "any" ? undefined : identity.nudge}
          />
        )}
      </div>
    </header>
  );
}

/** A section's own empty state: a sticker-shaped space waiting to be filled and an invitation in plain words. */
export function ToolEmpty({ look, children }: { look: ToolArtName; children?: ReactNode }) {
  const identity = toolLooks[look];
  const copy = identity.empty ?? { title: "Nothing here yet", text: "" };
  return (
    <div className={`tool-empty tint-${identity.tint}`}>
      <span className="tool-empty-badge" aria-hidden="true">
        <Plus size={30} strokeWidth={2.75} />
      </span>
      <h3>{copy.title}</h3>
      {copy.text && <p>{copy.text}</p>}
      {children && <div className="tool-empty-actions">{children}</div>}
    </div>
  );
}
