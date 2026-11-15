import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";
import "../app/public-pages.css";

export function PublicContents({
  sections,
}: {
  sections: ReadonlyArray<{ id: string; title: string }>;
}) {
  return (
    <nav className="public-contents" aria-label="On this page">
      <p>On this page</p>
      <ul>
        {sections.map(({ id, title }) => (
          <li key={id}><a href={`#${id}`}>{title}</a></li>
        ))}
      </ul>
    </nav>
  );
}

export default function PublicPage({
  title,
  intro,
  back,
  meta,
  art,
  theme,
  children,
}: {
  title: string;
  intro?: string;
  back?: { href: string; label: string; documentNavigation?: boolean };
  meta?: ReactNode;
  art?: ReactNode;
  theme?: "guide" | "journal" | "community" | "contact";
  children?: ReactNode;
}) {
  const BackLink = back?.documentNavigation ? "a" : Link;

  return (
    <div className={theme ? `public-page public-page--${theme}` : "public-page"}>
      <SiteHeader />
      <main id="main-content" className="site-container public-main">
        <header className={art ? "public-intro public-intro--illustrated" : "public-intro"}>
          <div className="public-intro-copy">
            {back && (
              <BackLink href={back.href} className="public-back">
                <ArrowLeft size={17} aria-hidden="true" />
                {back.label}
              </BackLink>
            )}
            {meta && <div className="public-meta">{meta}</div>}
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
          </div>
          {art && <div className="public-hero-art" aria-hidden="true">{art}</div>}
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
