import type { Metadata } from "next";
import Link from "next/link";
import PublicPage, { PublicContents } from "@/components/PublicPage";
import { AI_LIMITS, AI_SITE_DAILY_LIMIT } from "@/lib/ai-limits";

export const metadata: Metadata = {
  title: "Security, privacy and AI | Cosmogov",
  description:
    "How Cosmogov protects accounts and community spaces, where data is kept, what the AI helpers can and can't do, and what isn't done yet.",
  alternates: { canonical: "/trust" },
};

// Every statement on this page is checked against the code and the live
// configuration. When something changes, change it here in the same commit.
// The AI status is read from the deployment's settings when the page is built,
// so it can't drift from what is actually switched on.
function aiStatus() {
  const base = process.env.Z_AI_BASE_URL?.trim() ?? "";
  const hasKey = Boolean(process.env.Z_AI_API_KEY?.trim());
  const model = process.env.Z_AI_MODEL?.trim() || null;
  let host = "";
  try {
    host = base ? new URL(base).host : "";
  } catch {
    host = "";
  }
  const deepseek = host.endsWith("deepseek.com");
  return {
    state: !host ? ("off" as const) : hasKey ? ("on" as const) : ("setup" as const),
    provider: deepseek ? "DeepSeek" : host,
    model,
    deepseek,
  };
}

export default function TrustPage() {
  const ai = aiStatus();
  return (
    <PublicPage
      title="Security, privacy and AI"
      intro="What protects your account and your community today, what the AI helpers can and can't do, and what isn't done yet. Civic tools run on trust, so we say it plainly."
    >
      <div className="public-reading-layout">
        <PublicContents
          sections={[
            { id: "status", title: "Where things stand" },
            { id: "accounts", title: "Your account" },
            { id: "visibility", title: "Who sees what" },
            { id: "data", title: "Where data is kept" },
            { id: "ai", title: "AI helpers" },
            { id: "browser", title: "Protections in your browser" },
            { id: "not-yet", title: "Not done yet" },
            { id: "report", title: "Report a problem" },
          ]}
        />
        <div className="public-reading">
          <section id="status">
            <h2>Where things stand</h2>
            <p>
              Cosmogov is in beta. It is a small, early product, so we don't publish
              adoption figures or customer logos. What follows is what is true in the
              live service today, including the parts that aren't finished.
            </p>
          </section>

          <section id="accounts">
            <h2>Your account</h2>
            <ul>
              <li>Passwords are stored only as bcrypt hashes. Nobody at Cosmogov can read them.</li>
              <li>
                Sign-in uses a signed, expiring session cookie that scripts on the page
                can't read. Signing out ends that session, and{" "}
                <Link href="/dashboard/settings">Settings</Link> can sign you out on every device.
              </li>
              <li>Repeated sign-in attempts, sign-ups, posts and form messages are rate-limited.</li>
              <li>Voting, signing and AI help need a confirmed email address, so throwaway accounts can't add ballots or signatures.</li>
              <li>
                Official access is granted only through single-use, expiring invitations
                from an administrator, tied to one email address.
              </li>
            </ul>
          </section>

          <section id="visibility">
            <h2>Who sees what</h2>
            <ul>
              <li>Community activity is visible only to signed-in members. Nothing in the workspace is open to search engines.</li>
              <li>
                Private communities, processes, assemblies and debates are visible only to
                their creator and the people inside them, including on the map.
              </li>
              <li>
                Proposal results show totals. Each ballot is linked to the voter's
                account, and only that person can see their own ballot.
              </li>
              <li>Voting and signing never earn points, stickers or ranking. Activity never changes the weight of a vote.</li>
            </ul>
          </section>

          <section id="data">
            <h2>Where data is kept</h2>
            <ul>
              <li>The app runs on Vercel, in Washington, D.C. (US East).</li>
              <li>The database is on Supabase, in the US East (North Virginia) region.</li>
              <li>Account and activity emails are sent through Resend.</li>
              {ai.state !== "off" && (
                <li>
                  AI requests go to {ai.provider}
                  {ai.deepseek
                    ? ", a company based in China. Its privacy policy says it stores data on servers in China."
                    : "."}
                </li>
              )}
              <li>The community map loads its map tiles from OpenFreeMap. Fonts load from Google Fonts.</li>
              <li>There are no advertising or analytics trackers on Cosmogov.</li>
              <li>We don't sell personal data. Read the <Link href="/privacy">privacy policy</Link> for your rights and how to make a request.</li>
            </ul>
          </section>

          <section id="ai">
            <h2>AI helpers</h2>
            {ai.state === "on" && (
              <p>
                <strong>
                  The AI helpers use {ai.provider}
                  {ai.model ? ` (model ${ai.model})` : ""}.
                </strong>{" "}
                {ai.deepseek &&
                  "What you send to them, including text you paste into a mission or debate, is processed by DeepSeek in China. Don't paste personal details you wouldn't want to leave the EU. "}
                Everything else in Cosmogov works without them.
              </p>
            )}
            {ai.state === "setup" && (
              <p>
                <strong>The AI helpers are being switched on with {ai.provider}</strong>
                {ai.deepseek ? ", which processes requests in China" : ""}. Until then they
                are off, and everything else works without them.
              </p>
            )}
            {ai.state === "off" && (
              <p>
                <strong>Right now the AI helpers are switched off on the live site.</strong>{" "}
                Everything else works without them. Before they are switched on, this page
                will name the AI provider and model.
              </p>
            )}
            <p>When they are on, these rules are built in, not just promised:</p>
            <ul>
              <li>AI never votes, signs or decides. A person reviews and adopts every plan, form or draft before it counts.</li>
              <li>AI answers are labelled as AI and can be wrong. The helpers are told not to invent facts, figures, laws or sources, and to say what someone should check.</li>
              <li>
                Community input is messy. Text that people write or paste is treated as
                material to work on, never as instructions, so a post can't talk the AI
                into changing its rules.
              </li>
              <li>On contested choices the helpers lay out options and trade-offs, without taking sides.</li>
              <li>The AI can't see ballots or private spaces. In missions it works only from the sources members add.</li>
              <li>
                The assistant only helps with community matters. It turns down general
                chat, code, homework and similar requests, remembers only the last few
                turns, and keeps answers short.
              </li>
              <li>
                Each person has AI allowances: {AI_LIMITS.assistant.hour} assistant
                questions an hour and {AI_LIMITS.assistant.day} a day,{" "}
                {AI_LIMITS.mission.hour} mission AI runs an hour and {AI_LIMITS.mission.day} a
                day, and {AI_LIMITS.debate.hour} debate helper replies an hour and{" "}
                {AI_LIMITS.debate.day} a day. The whole site stops using AI for the day after{" "}
                {AI_SITE_DAILY_LIMIT} requests. Pro and Government plans have higher allowances, listed in Settings. Debate posts are capped at 40 an hour.
              </li>
              <li>Mission runs record which provider, model and instructions produced each draft.</li>
            </ul>
          </section>

          <section id="browser">
            <h2>Protections in your browser</h2>
            <ul>
              <li>Cosmogov is served only over HTTPS.</li>
              <li>Other sites can't embed Cosmogov in a frame to trick you into clicking.</li>
              <li>Signed-in pages and answers aren't stored in shared caches.</li>
              <li>Text from other people is escaped before it is shown, including in map pop-ups.</li>
            </ul>
          </section>

          <section id="not-yet">
            <h2>Not done yet</h2>
            <ul>
              <li>No independent security audit or penetration test has been done yet, and Cosmogov holds no security certification.</li>
              <li>
                Data is kept in the United States
                {ai.state !== "off" && ai.deepseek ? ", and AI requests are processed in China" : ""}.
                Hosting and AI processing in the EU aren't available yet.
              </li>
              <li>
                Ballots are linked to accounts, and accounts are confirmed by email only:
                real-world identity isn't verified.
                Cosmogov is not suitable for secret-ballot or legally binding elections.
              </li>
              <li>Formal proposals check signatures before they count, but this is not an official identity check.</li>
            </ul>
          </section>

          <section id="report">
            <h2>Report a problem</h2>
            <p>
              If you find a security or privacy issue, please tell us through the{" "}
              <Link href="/contact?topic=security">security report form</Link>. We read
              every report and will tell you what we changed. Please don't access other
              people's data while testing.
            </p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
