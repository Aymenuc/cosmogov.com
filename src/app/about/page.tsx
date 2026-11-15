import type { Metadata } from "next";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Our mission | Cosmogov",
  description: "Why Cosmogov helps communities turn shared questions into plans, decisions, and visible action.",
};

export default function AboutPage() {
  return (
    <PublicPage
      title="Our mission"
      intro="Cosmogov helps communities turn a shared question into a decision people can understand and an outcome they can follow."
    >
      <div className="public-stack">
        <section className="public-card public-feature">
          <h2>Make it easier for people to take part</h2>
          <p>A neighborhood group planning a repair café and a local government collecting budget proposals face a similar problem. They need to hear from people, explain what was decided, and keep everyone informed as the work moves forward. We build tools for those steps.</p>
        </section>
        <div className="public-grid">
          <section className="public-card">
            <h2>Start with the community</h2>
            <p>Use proposals, assemblies, budgets, or forms to fit the decision at hand. Give people a clear question and explain what their participation can change.</p>
          </section>
          <section className="public-card">
            <h2>Keep decisions with people</h2>
            <p>Mission Studio can help research an issue and draft a summary, plan, or form. Organizers review the work and decide what to adopt and share.</p>
          </section>
          <section className="public-card">
            <h2>Show the follow-through</h2>
            <p>Record who owns the next task, when a response is due, and what evidence is available to the people following the work.</p>
          </section>
        </div>
        <section className="public-card">
          <h2>See it in practice</h2>
          <p>Walk through an <Link href="/missions/demo">example mission</Link> or <Link href="/contact?topic=partnership">tell us about your community</Link>.</p>
        </section>
      </div>
    </PublicPage>
  );
}
