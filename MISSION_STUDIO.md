# Community-directed AI work

Cosmogov now has a shared mission workspace at `/dashboard/missions`. Members bring a goal, sources, constraints, and perspectives. Four explicitly invoked AI steps help research the evidence (Scout), map contributed perspectives (Bridge), draft practical tasks (Maker), and generate a participation form (Studio). The same mission context carries between steps; each output keeps its own reference snapshot.

People can also build a form without AI or edit a generated form before publishing. Each save creates a new immutable draft with its origin (`ai`, `edited`, or `manual`) and a link to the source version. Published forms and their responses are preserved when a revision is created.

The useful unit is a shared artifact: a research brief, a plan people can claim tasks from, or a published form with actual member responses. The creator or a community moderator reviews plans and forms before adopting them. Regular members can contribute context, take responsibility for tasks, and respond to published forms. New forms default to organizer-only answers with a 90-day availability period; organizers can choose member-visible answers and 30, 90 or 365 days before publication. Existing forms retain their original member visibility and indefinite availability until replaced or removed. Private missions are visible only to their creator; shared missions follow current organization membership.

## What works

- PostgreSQL persistence for missions, contributions, AI runs, source snapshots, tasks, and responses.
- Structured AI outputs validated against known reference IDs. References identify contributed excerpts or web snippets; their presence does not prove a claim is true.
- Optional web search through the existing Z AI SDK. Chat-only providers work with member-supplied context and clearly report unavailable search.
- Revision checks prevent adopting a draft after its source context changes. Published forms remain available beyond the recent 20-run history.
- Visible acceptance names/dates, open references, response visibility notices, and a contribution strip derived from actual mission records.
- Exactly-once task adoption, atomic task claims, member-owned responses, a per-user 12-run hourly quota, and a per-mission run lease with timeout recovery.
- Manual and AI-generated forms use the same validated text and choice fields. Managers can edit wording, choices, required answers, and question order; add or remove questions; and preview the layout before saving. A saved draft still needs publication.
- Form draft saves have a separate 60-per-person hourly limit; they do not invoke a provider or consume the 12-run AI quota. Stale source context blocks editing and adoption.
- AI-generated forms use validated text and choice fields. No generated JavaScript runs in the browser or server.
- Public interactive example at `/missions/demo`. All example people, sources, and outputs are labeled illustrative. Its changes last only until reload; loading an example does not invoke AI or analyze edited inputs.

These are four user-directed AI jobs using the configured chat provider. They are not independent autonomous agents. No external messages, purchases, official decisions, or deployments are performed by the AI. Live voice, personal delegates, scheduled background agents, document ingestion, and outcome learning are not implemented in this iteration.

## Configuration

1. Configure PostgreSQL `DATABASE_URL` and `DIRECT_URL`, then run `npm run db:migrate:deploy`. The mission migrations are `20261114120000_mission_studio` and `20261114190000_editable_mission_forms`.
2. Configure a cryptographically random `SESSION_SECRET` of at least 32 characters, shared by every production worker. The previous unsigned user-ID cookie has been replaced with HMAC-signed, expiring sessions; existing users must sign in again. Development can use an ephemeral process secret.
3. Configure the existing AI adapter with `Z_AI_BASE_URL`, `Z_AI_API_KEY`, and `Z_AI_MODEL`. For an OpenAI-compatible endpoint, set `Z_AI_USE_OPENAI_COMPAT=1` and, where needed, `Z_AI_SKIP_CHAT_TEMPLATE_KWARGS=1`.
4. Enable `MISSION_WEB_SEARCH=1` only with a compatible Z AI SDK search endpoint. It is disabled for OpenAI-compatible chat endpoints.
5. Allow the run route up to 120 seconds. AI runs are synchronous, with bounded search/model waits and a database lease; there is no background job queue. A disconnected client can reload persisted results, but a terminated server worker cannot resume its work.

Provider failures keep the contributions and record a failed run. They never silently substitute demonstration content. This workspace contains no deployment database or live provider credentials, so external model quality, live search, and deployment execution still require verification in the configured environment.

## Verification

`node --test scripts/check-session.cjs scripts/check-voting.cjs` exercises signed-session boundaries and voting rules.

`scripts/check-missions.cjs` starts disposable PostgreSQL, applies all migrations, starts the real Next.js application, and supplies a local HTTP model fixture. It checks API authorization and persistence, model failures and citations, stale adoption, concurrent operations, forms, browser interactions, responsive layouts, and quotas. It never calls a paid model. Install `embedded-postgres` outside the repository and pass its module path as `COSMOGOV_EMBEDDED_PG`; Playwright and Chromium are also required. Results and screenshots go to `artifacts/missions` by default.

`node scripts/check-redesign.cjs` retains the broader fixture-backed homepage, civic desk, decision room, account, navigation, and process-creation checks against a running local server.

The repository already ignores TypeScript errors during builds. The full typecheck still has 16 pre-existing diagnostics; none are in the mission or signed-session implementation.

## Research informing the direction

- [Anthropic: components of agent memory](https://www.anthropic.com/research/components-of-agent-memory) — persistent, inspectable task context.
- [Anthropic: multi-agent research system](https://www.anthropic.com/research/multi-agent-research-system) — clear specialist jobs and evidence handoffs.
- [Collective Intelligence Project: community models](https://blog.cip.org/p/community-models) — community input shaping AI work.
- [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) — interactive artifacts as an AI interaction pattern. This implementation uses native validated forms, not an MCP Apps runtime.

## Redesign continuity

This work incorporates Claude’s `claude/portal-stickers` branch at `d35332c`, including the interactive landing mission board, original illustrations, portal stickers and garden, group-specific mission starters, and intent-based participation entry. The mission review and readability improvements from `2ee77a5` remain. The form editor uses the same palette, typography, sticker artwork and quiet reading surfaces; it does not introduce a separate design system.

Organizers can close, unpublish and reopen forms, stream a CSV export, and delete a mission after typing its title. Response exports neutralize spreadsheet formulas. Published form terms are immutable; changing visibility or retention requires a new version. Closed forms keep permitted responses readable and deletable, while new saves are blocked. An unpublished form is visible only to organizers and people with a saved response.

Task completion requires a concrete note and optional evidence URL. Changes write an actor/time event in the same transaction as the task state. Evidence remains member-provided, not independently verified. AI runs record their configured provider/model and prompt version (provider-reported model takes precedence when available), and author metadata is replaced with contributor labels before requests. Names written inside source text can still be sent; the input dialog says so.

Sensitive-question patterns flag common contact, identity, financial and personal-data requests. They require organizer-only answers and an explicit review basis before a form can be saved or published. This is a review aid and can miss sensitive questions; it does not establish a legal basis.

Responses record the notice version and expiry at each save. Expired answers are hidden in reads and exports, and removed when their mission is opened. The daily authenticated cleanup job also removes expired answers, rate counters and token revocations. Configure CRON_SECRET and the hosting scheduler; Vercel uses the included daily cron. Live-provider staging verification remains pending a staging URL and configured credentials.
