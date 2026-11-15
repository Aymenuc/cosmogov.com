import type { Metadata } from "next";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Changelog | Cosmogov",
  description: "Recent Cosmogov changes to Mission Studio, community participation, and the map.",
};

export default function ChangelogPage() {
  return (
    <PublicPage
      title="Changelog"
      intro="Product changes and where to find them in Cosmogov."
    >
      <div className="public-stack">
        <section className="public-card public-feature">
          <div className="public-meta"><time dateTime="2026-11-15">November 15, 2026</time></div>
          <h2>Community map and account emails</h2>
          <ul>
            <li>The <Link href="/dashboard/cosmic-map">community map</Link> uses an OpenFreeMap basemap and highlights activity tied to places.</li>
            <li>The <Link href="/dashboard/stickers">sticker book</Link> and <Link href="/dashboard/record">civic record</Link> give participants places to revisit their progress and contributions.</li>
            <li>Account and notification emails use the current Cosmogov design and link back to the relevant actions.</li>
          </ul>
        </section>
        <section className="public-card">
          <div className="public-meta"><time dateTime="2026-11-14">November 14, 2026</time></div>
          <h2>Mission Studio and community participation</h2>
          <ul>
            <li><Link href="/dashboard/missions">Mission Studio</Link> helps communities research a goal, summarize input, draft a plan, and create a participation form. Each draft is reviewed before use.</li>
            <li>Organizers can preview, publish, close, reopen, and export forms. Participants see who can read their answers and how long they are kept.</li>
            <li>Participants can opt in to task invitations. Organizers can record task completion and reuse selected plan or form text in credited templates.</li>
            <li><Link href="/dashboard/participation/accountability">Accountability</Link> shows visible mission outcomes, evidence, and formal response deadlines.</li>
            <li>Proposal results show totals and the signed-in voter’s own ballot. Account sessions are signed and can be revoked.</li>
          </ul>
        </section>
        <section className="public-card">
          <h2>Try the current workspace</h2>
          <p>Explore the <Link href="/missions/demo">example mission</Link> or use the <Link href="/docs">documentation</Link> to start one with your community.</p>
        </section>
      </div>
    </PublicPage>
  );
}
