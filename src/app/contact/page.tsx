import type { Metadata } from "next";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";
import ContactForm from "./ContactForm";
import { topics } from "./topics";

export const metadata: Metadata = {
  title: "Contact | Cosmogov",
  description: "Contact Cosmogov about support, plans, billing, partnerships, careers, privacy, or security.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{
    topic?: string | string[];
    plan?: string | string[];
  }>;
}) {
  const { topic, plan } = await searchParams;
  const initialTopic = topics.find(({ value }) => value === topic)?.value ?? "general";
  const requestedPlan = initialTopic === "sales"
    ? ["Community", "Pro", "Government"].find((name) => name === plan)
    : undefined;

  return (
    <PublicPage
      title="Get in touch"
      intro="Ask for help, tell us what your community is working on, or talk to us about bringing Cosmogov to your organization."
    >
      <div className="public-columns">
        <section className="public-card">
          <h2>{requestedPlan ? "Ask about " + requestedPlan : "Send a message"}</h2>
          <ContactForm
            key={requestedPlan ?? initialTopic}
            initialTopic={initialTopic}
            requestedPlan={requestedPlan}
          />
        </section>
        <aside className="public-card public-feature">
          <h2>What to include</h2>
          <ul>
            <li>For support, tell us what you were trying to do and what happened. Include the page link if you have it.</li>
            <li>For pricing, invoices or payments, tell us the plan or billing question.</li>
            <li>For a group or organization, tell us who you’re bringing together and what you want to run.</li>
          </ul>
          <p>For help getting started, see the <Link href="/docs">documentation</Link>. For data requests, see the <Link href="/privacy">privacy policy</Link>.</p>
        </aside>
      </div>
    </PublicPage>
  );
}
