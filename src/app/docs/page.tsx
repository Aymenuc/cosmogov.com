import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PublicPage from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Documentation | Cosmogov",
  description: "Get started with communities, missions, participation, and decisions in Cosmogov.",
};

const guides = [
  {
    id: "mission-studio",
    title: "Run a mission",
    description: "Start with a concrete question and say who should help answer it. Gather source material and contributions, then request the AI steps you need.",
    steps: [
      "Scout drafts research from the source material it receives. Check the references and any gaps before using it.",
      "Bridge groups contributions into themes, including points of disagreement. Review which material you send.",
      "Maker drafts tasks for a plan you can edit and adopt. The action board tracks assignments, completion notes, and evidence.",
      "Studio drafts forms. Organizers can also write forms themselves, preview them, and choose who can read responses before publishing.",
    ],
    href: "/dashboard/missions",
    action: "Open Mission Studio",
  },
  {
    id: "participation",
    title: "Collect input and make a decision",
    description: "Choose the activity that fits your question. Gather input through a form or an assembly, use a proposal to record a vote, or use participatory budgeting to decide how to allocate funds.",
    steps: [
      "When publishing a mission form, check the audience, retention period, and response notice shown to participants.",
      "In a proposal, explain the decision, who can take part, and when voting closes. Proposal vote totals are shared where readers have access. Individual ballots are linked to accounts.",
    ],
    href: "/dashboard/participation",
    action: "Open participation tools",
  },
  {
    id: "follow-through",
    title: "Follow through and reuse what worked",
    description: "Record a completion note and add an evidence link when available. Accountability shows recent outcomes and response deadlines for work you can access.",
    steps: [
      "Offer to help only if you want organizers to consider your response for a task. You decide whether to accept an invitation.",
      "Save selected plan or form text as a template when others can reuse it. Review the text first. Templates carry credit and exclude form responses and participation history.",
    ],
    href: "/dashboard/participation/accountability",
    action: "Open Accountability",
  },
];

export default function DocsPage() {
  return (
    <PublicPage
      title="Documentation"
      intro="Start a community, work on a shared goal in Mission Studio, and follow the decisions that come out of it."
    >
      <div className="public-stack">
        <section className="public-card public-feature">
          <h2>Start here</h2>
          <ol>
            <li><Link href="/auth/signup">Create an account</Link> or <Link href="/auth/login">sign in</Link>.</li>
            <li>Open <Link href="/dashboard/organizations">My communities</Link> to find a group you belong to or create a workspace for your group.</li>
            <li>Try the <Link href="/missions/demo">public example mission</Link> to see a research brief, a plan, and a participation form.</li>
          </ol>
        </section>
        {guides.map((guide) => (
          <section className="public-card" id={guide.id} key={guide.id}>
            <h2>{guide.title}</h2>
            <p>{guide.description}</p>
            <ul>
              {guide.steps.map((step) => <li key={step}>{step}</li>)}
            </ul>
            <Link href={guide.href} className="public-link">
              {guide.action} <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ))}
        <section className="public-card">
          <h2>Developers and support</h2>
          <p>Read the <Link href="/docs/api">API reference</Link> for session-based request examples, see what changed in the <Link href="/changelog">changelog</Link>, or <Link href="/contact">get in touch</Link> if you need help.</p>
        </section>
      </div>
    </PublicPage>
  );
}
