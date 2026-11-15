import type { Metadata } from "next";
import Link from "next/link";
import PublicPage, { PublicContents } from "@/components/PublicPage";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "For councils and public bodies | Cosmogov",
  description:
    "What Cosmogov offers councils and public bodies, how officials take part, where data is kept, and what it is not suitable for.",
  alternates: { canonical: "/government" },
};

// Plain facts for a council officer deciding whether to try Cosmogov.
// Only list what exists; keep the limits honest.
export default function GovernmentPage() {
  const gov = PLANS.government;
  return (
    <PublicPage
      title="For councils and public bodies"
      intro="Cosmogov helps residents bring ideas, discuss them and show support, and gives your officials a place to reply on the record. Here is exactly what you get, and what it is not for."
    >
      <div className="public-reading-layout">
        <PublicContents
          sections={[
            { id: "what", title: "What you can run" },
            { id: "officials", title: "How officials take part" },
            { id: "plan", title: "Plan and price" },
            { id: "data", title: "Data, security and AI" },
            { id: "not-for", title: "What it is not for" },
            { id: "start", title: "Getting started" },
          ]}
        />
        <div className="public-reading">
          <section id="what">
            <h2>What you can run</h2>
            <ul>
              <li>Participatory budgeting: residents propose projects and share out a budget.</li>
              <li>Surveys, citizen initiatives that gather support, and drafts of rules or policies open for comments and suggested changes.</li>
              <li>Assemblies and meetings, panels picked by lottery, and debates with optional AI helpers that summarise, translate and simplify.</li>
              <li>Formal proposals with public thresholds and signature review, plus an accountability page that tracks what was promised and what was done.</li>
            </ul>
          </section>

          <section id="officials">
            <h2>How officials take part</h2>
            <p>
              Officials get accounts through single-use invitations tied to their work email.
              From the Government portal they read initiatives and formal proposals and reply
              on the record. Replies carry the official&apos;s name, and the people who signed
              are told when you respond. Decisions stay with your own processes.
            </p>
          </section>

          <section id="plan">
            <h2>Plan and price</h2>
            <p>
              The {gov.name} plan is ${gov.monthly} a month, or ${gov.yearlyPerMonth} a month
              billed yearly, before any local tax, invoiced. It includes:
            </p>
            <ul>
              {gov.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <section id="data">
            <h2>Data, security and AI</h2>
            <ul>
              <li>Data is kept in the United States (Vercel and Supabase, US East). EU hosting isn&apos;t available yet.</li>
              <li>AI helpers are optional and run on DeepSeek, which processes requests in China. They never vote or decide, and they can&apos;t see ballots.</li>
              <li>Private spaces stay private, accounts are confirmed by email, and votes and signatures never earn rewards.</li>
            </ul>
            <p>
              The full detail, including what isn&apos;t done yet, is on{" "}
              <Link href="/trust">Security, privacy and AI</Link> and in our{" "}
              <Link href="/accessibility">accessibility statement</Link>.
            </p>
          </section>

          <section id="not-for">
            <h2>What it is not for</h2>
            <ul>
              <li>Secret-ballot or legally binding elections: ballots are linked to accounts, and identity is confirmed by email only.</li>
              <li>Statutory consultations that require data to stay in the EU or UK, until EU hosting is available.</li>
            </ul>
          </section>

          <section id="start">
            <h2>Getting started</h2>
            <p>
              Tell us what you want to run and who it&apos;s for through the{" "}
              <Link href="/contact?topic=sales&plan=Government">contact form</Link>. We&apos;ll
              reply in writing with how it would work for you, and ask about your data
              protection requirements.
            </p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
