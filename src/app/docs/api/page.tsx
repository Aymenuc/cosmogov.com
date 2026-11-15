import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "API reference | Cosmogov",
  description: "Session authentication and read endpoints for the Cosmogov web app.",
};

const endpoints = [
  ["/api/auth/me", "Returns the signed-in account profile."],
  ["/api/organizations", "Lists communities the signed-in user belongs to, including their role and membership and proposal counts."],
  ["/api/missions", "Lists up to 50 personal or community missions the signed-in user can access, ordered by last update."],
  ["/api/proposals", "Lists up to 50 visible proposals. Filter by status, orgId, search, or category."],
  ["/api/participation/accountability", "Returns accessible participation milestones and recent mission outcomes."],
];

const example = `// Run on your Cosmogov site's origin after signing in.
const response = await fetch("/api/missions");
if (!response.ok) {
  throw new Error(\`Cosmogov returned \${response.status}\`);
}
const missions = await response.json();`;

export default function ApiReferencePage() {
  return (
    <PublicPage
      title="API reference"
      intro="The Cosmogov web app uses JSON endpoints on the same origin as the site. These examples use the session of the signed-in account."
      back={{ href: "/docs", label: "Documentation" }}
    >
      <div className="public-stack">
        <section className="public-card">
          <h2>Authentication</h2>
          <p>Sign in on the site, or send an email and password as JSON to <code>POST /api/auth/login</code>. A successful login sets the HTTP-only <code>cosmogov_session</code> cookie and returns a profile. A browser sends the cookie on same-origin requests. A command-line client needs a cookie jar.</p>
          <p>Keep session cookies and passwords private. Account roles and community membership determine what the session can access.</p>
        </section>
        <section className="public-card">
          <h2>Read data</h2>
          <p>This example fetches the missions visible to the signed-in user.</p>
          <pre className="public-code"><code>{example}</code></pre>
          <dl className="public-route-list">
            {endpoints.map(([path, description]) => (
              <div key={path}>
                <dt><code>GET {path}</code></dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="public-card">
          <h2>Handle errors</h2>
          <p>Check the HTTP status before reading the result. A protected request can return <code>401</code> if the session is missing or expired, or <code>403</code> if the account lacks permission. Some writes return <code>429</code> when their rate limit is reached.</p>
        </section>
      </div>
    </PublicPage>
  );
}
