import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";
import "../app/public-pages.css";

export default function PublicPage({
  title,
  intro,
  back,
  meta,
  children,
}: {
  title: string;
  intro?: string;
  back?: { href: string; label: string };
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="public-page">
      <SiteHeader />
      <main id="main-content" className="site-container public-main">
        <header className="public-intro">
          {back && (
            <Link href={back.href} className="public-back">
              <ArrowLeft size={16} aria-hidden="true" />
              {back.label}
            </Link>
          )}
          {meta && <div className="public-meta">{meta}</div>}
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
