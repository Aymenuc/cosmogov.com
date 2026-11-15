import type { Metadata } from "next";
import Link from "next/link";
import PublicPage, { PublicContents } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "Accessibility statement | Cosmogov",
  description: "How accessible Cosmogov is, how we test it, what doesn't work well yet, and how to tell us about a barrier.",
  alternates: { canonical: "/accessibility" },
};

// Keep this page in step with real testing. Update the date and findings
// whenever the checks are re-run.
export default function AccessibilityPage() {
  return (
    <PublicPage
      title="Accessibility statement"
      intro="Taking part shouldn't depend on how you see, hear, move or read. This is where Cosmogov stands today."
    >
      <div className="public-reading-layout">
        <PublicContents
          sections={[
            { id: "aim", title: "What we aim for" },
            { id: "testing", title: "How we test" },
            { id: "limits", title: "What doesn't work well yet" },
            { id: "contact", title: "Tell us about a barrier" },
          ]}
        />
        <div className="public-reading">
          <section id="aim">
            <h2>What we aim for</h2>
            <p>
              We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA,
              the standard used for public sector websites in the EU and the UK.
            </p>
            <p>
              Every section is checked at phone width so nothing needs sideways scrolling, and
              the drawings that animate stop moving when your device asks for reduced motion.
            </p>
          </section>

          <section id="testing">
            <h2>How we test</h2>
            <p>
              On 15 November 2026 we ran automated WCAG 2.1 A and AA checks (axe-core) on the
              public pages and every section of the workspace, and fixed every issue they
              found: colour contrast, labels for form fields and buttons, named progress bars
              and underlined links in text. We also checked every section at phone width.
            </p>
            <p>
              Automated checks find only part of the problems. Cosmogov has not yet been
              audited by an independent accessibility specialist or tested with screen reader
              users, so we don&apos;t claim full conformance.
            </p>
          </section>

          <section id="limits">
            <h2>What doesn&apos;t work well yet</h2>
            <ul>
              <li>The community map is a visual map. Everything on it is also listed beside it as text, which is the easier way to use it with a screen reader.</li>
              <li>The animated Pulse picture and the Assembly hall graphics are decorative; the same figures are shown as text next to them.</li>
              <li>Some civic games rely on timing and visual patterns and may be hard to play with assistive technology.</li>
              <li>AI answers are generated text and may not always use the plainest wording. The plain-language helper can rewrite messages in debates.</li>
            </ul>
          </section>

          <section id="contact">
            <h2>Tell us about a barrier</h2>
            <p>
              If something stops you taking part, or you need information in another format,
              please tell us through the <Link href="/contact?topic=support">contact form</Link>.
              We&apos;ll reply, and we treat accessibility problems as bugs to fix, not
              requests to consider.
            </p>
            <p>This statement was last reviewed on 15 November 2026.</p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
