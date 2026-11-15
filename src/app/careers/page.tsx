import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PublicPage from "@/components/PublicPage";
import { areas } from "./areas";

export const metadata: Metadata = {
  title: "Careers | Cosmogov",
  description: "Explore the work behind Cosmogov and ask about hiring.",
};

export default function CareersPage() {
  return (
    <PublicPage
      title="Careers"
      intro="Explore the work behind Cosmogov. Get in touch to ask about current openings or tell us how you’d like to contribute."
    >
      <div className="public-stack">
        <div className="public-grid">
          {areas.map((area) => (
            <article className="public-card" key={area.id}>
              <h2>
                <Link className="public-link" href={`/careers/${area.id}`}>
                  {area.title} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </h2>
              <p>{area.description}</p>
            </article>
          ))}
        </div>
        <section className="public-card public-feature">
          <h2>Ask about opportunities</h2>
          <p>Tell us which area interests you and, if useful, include a link to relevant work.</p>
          <Link href="/contact?topic=careers" className="public-link">
            Contact Cosmogov <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </PublicPage>
  );
}
