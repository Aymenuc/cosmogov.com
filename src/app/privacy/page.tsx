import type { Metadata } from "next";
import Link from "next/link";
import PublicPage, { PublicContents } from "@/components/PublicPage";

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
      <div className="public-reading-layout">
        <PublicContents sections={[
            { id: "accounts", title: "Accounts and participation" },
            { id: "missions", title: "Mission forms and AI" },
            { id: "security", title: "Sessions, security, and location" },
            { id: "processors", title: "Services that handle your data" },
            { id: "requests", title: "Your choices and requests" },
        ]} />
        <div className="public-reading">
          <section id="accounts">
            <h2>Accounts and participation</h2>
            <p>We use your account details, such as your name and email address, to provide the service, manage your communities, and send account and activity notifications. We process content you submit, including proposals, comments, votes, and mission contributions, to run the activities you take part in.</p>
            <p>Access depends on the activity, your role, and the community or mission settings. Proposal results show vote totals to authorized readers. Proposal ballots are linked to accounts, and the voter can view their own ballot.</p>
          </section>
          <section id="missions">
            <h2>Mission forms and AI</h2>
            <p>Before you save an answer, a mission form tells you who can see your name and answers and how long the answers are kept. You can remove your response before it expires. If a form has a retention period, it runs from your last save.</p>
            <p>When an organizer requests an AI draft, material selected for that step may be sent to the configured AI provider. Details written inside source text can be included. Organizers should review the material before sending it and check the draft before using it.</p>
          </section>
          <section id="security">
            <h2>Sessions, security, and location</h2>
            <p>Cosmogov uses a signed session cookie to keep you signed in. We use technical information to protect accounts, enforce rate limits, and troubleshoot the service. You can end your session by signing out.</p>
            <p>You can allow your browser to use your location to center the community map. Saving a home city to your account is a separate action.</p>
            <p>We do not sell or rent personal data or share it with third parties for their own marketing. We will seek your consent before using your data for a purpose beyond those described in this policy.</p>
          </section>
          <section id="processors">
            <h2>Services that handle your data</h2>
            <p>Cosmogov relies on these services to run. Each handles only what it needs for its part:</p>
            <ul>
              <li><strong>Vercel</strong> (United States) runs the website and app.</li>
              <li><strong>Supabase</strong> (United States, US East region) stores the database.</li>
              <li><strong>Resend</strong> sends account and activity emails.</li>
              <li><strong>DeepSeek</strong> (China) runs the optional AI helpers. Only what you ask a helper to work on is sent, including any text you paste. Don&apos;t paste personal details you wouldn&apos;t want processed outside the EU.</li>
              <li><strong>Stripe</strong> handles card payments for paid plans, if you upgrade. Cosmogov never sees your card number.</li>
              <li><strong>OpenFreeMap</strong> provides map tiles and <strong>Google Fonts</strong> provides the typefaces; like any website, they see your IP address when your browser loads them.</li>
            </ul>
            <p>More detail is on <Link href="/trust">Security, privacy and AI</Link>.</p>
          </section>
          <section id="requests">
            <h2>Your choices and requests</h2>
            <p>You can review account details in <Link href="/dashboard/settings">Settings</Link>. Use the <Link href="/contact?topic=privacy">privacy request form</Link> to ask about accessing, correcting, deleting, or receiving a copy of your personal data.</p>
            <p>Where applicable, you can also ask to restrict processing, object to it, withdraw consent for consent-based processing, or complain to your data protection authority. The <a href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en">European Commission’s guide</a> explains these rights under the GDPR.</p>
            <p>For an account or data security concern, use the <Link href="/contact?topic=security">security report form</Link>. <Link href="/trust">Security, privacy and AI</Link> explains where data is kept and how the AI helpers work.</p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
