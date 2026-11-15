import type { Metadata } from "next";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Privacy policy | Cosmogov",
  description: "How Cosmogov handles accounts, participation data, mission forms, and privacy requests.",
};

export default function PrivacyPage() {
  return (
    <PublicPage
      title="Privacy policy"
      intro="Learn what information Cosmogov uses to run your account and community activities, what others can see, and how to make a privacy request."
    >
      <div className="public-stack">
        <section className="public-card">
          <h2>Accounts and participation</h2>
          <p>We use your account details, such as your name and email address, to provide the service, manage your communities, and send account and activity notifications. We process content you submit, including proposals, comments, votes, and mission contributions, to run the activities you take part in.</p>
          <p>Access depends on the activity, your role, and the community or mission settings. Proposal results show vote totals to authorized readers. Proposal ballots are linked to accounts, and the voter can view their own ballot.</p>
        </section>
        <section className="public-card">
          <h2>Mission forms and AI</h2>
          <p>Before you save an answer, a mission form tells you who can see your name and answers and how long the answers are kept. You can remove your response before it expires. If a form has a retention period, it runs from your last save.</p>
          <p>When an organizer requests an AI draft, material selected for that step may be sent to the configured AI provider. Details written inside source text can be included. Organizers should review the material before sending it and check the draft before using it.</p>
        </section>
        <section className="public-card">
          <h2>Sessions, security, and location</h2>
          <p>Cosmogov uses a signed session cookie to keep you signed in. We use technical information to protect accounts, enforce rate limits, and troubleshoot the service. You can end your session by signing out.</p>
          <p>You can allow your browser to use your location to center the community map. Saving a home city to your account is a separate action.</p>
          <p>We do not sell or rent personal data or share it with third parties for their own marketing. We will seek your consent before using your data for a purpose beyond those described in this policy.</p>
        </section>
        <section className="public-card public-feature">
          <h2>Your choices and requests</h2>
          <p>You can review account details in <Link href="/dashboard/settings">Settings</Link>. Use the <Link href="/contact?topic=privacy">privacy request form</Link> to ask about accessing, correcting, deleting, or receiving a copy of your personal data.</p>
          <p>Where applicable, you can also ask to restrict processing, object to it, withdraw consent for consent-based processing, or complain to your data protection authority. The <a href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en">European Commission’s guide</a> explains these rights under the GDPR.</p>
          <p>For an account or data security concern, use the <Link href="/contact?topic=security">security report form</Link>.</p>
        </section>
      </div>
    </PublicPage>
  );
}
