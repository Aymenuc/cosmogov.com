# Community-directed AI work

Cosmogov now has a shared mission workspace at `/dashboard/missions`. Members bring a goal, sources, constraints, and perspectives. Four explicitly invoked AI steps help research the evidence (Scout), map contributed perspectives (Bridge), draft practical tasks (Maker), and generate a participation form (Studio). The same mission context carries between steps; each output keeps its own reference snapshot.

People can also build a form without AI or edit a generated form before publishing. Each save creates a new immutable draft with its origin (`ai`, `edited`, `manual`, or `template`) and a link to the source version. Published forms and their responses are preserved when a revision is created.

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

1. Configure PostgreSQL `DATABASE_URL` and `DIRECT_URL`, then run `npm run db:migrate:deploy`. Apply every checked-in migration, including civic integrity, mission controls and community coordination. They add session revocation, retained submission notices, task events, opt-in invitations and credited templates.
2. Configure a cryptographically random `SESSION_SECRET` of at least 32 characters, shared by every production worker. The previous unsigned user-ID cookie has been replaced with HMAC-signed, expiring sessions; existing users must sign in again. Development can use an ephemeral process secret.
3. Configure the existing AI adapter with `Z_AI_BASE_URL`, `Z_AI_API_KEY`, and `Z_AI_MODEL`. For an OpenAI-compatible endpoint, set `Z_AI_USE_OPENAI_COMPAT=1` and, where needed, `Z_AI_SKIP_CHAT_TEMPLATE_KWARGS=1`.
4. Enable `MISSION_WEB_SEARCH=1` only with a compatible Z AI SDK search endpoint. It is disabled for OpenAI-compatible chat endpoints.
5. Allow the run route up to 120 seconds. AI runs are synchronous, with bounded search/model waits and a database lease; there is no background job queue. A disconnected client can reload persisted results, but a terminated server worker cannot resume its work.

Provider failures keep the contributions and record a failed run. They never silently substitute demonstration content. This workspace contains no deployment database or live provider credentials, so external model quality, live search, and deployment execution still require verification in the configured environment.

## Verification

`node --test scripts/check-session.cjs scripts/check-voting.cjs` exercises signed-session boundaries and voting rules.

`scripts/check-missions.cjs` starts disposable PostgreSQL, applies all migrations, starts the real Next.js application, and supplies a local HTTP model fixture. It checks API authorization and persistence, model failures and citations, stale adoption, concurrent operations, forms, browser interactions, responsive layouts, and quotas. It never calls a paid model. Install `embedded-postgres` outside the repository and pass its module path as `COSMOGOV_EMBEDDED_PG`; Playwright and Chromium are also required. Results and screenshots go to `artifacts/missions` by default.

`node scripts/check-redesign.cjs` retains the broader fixture-backed homepage, civic desk, decision room, account, navigation, and process-creation checks against a running local server.

Set `COSMOGOV_TEST_MODE=production` when running `scripts/check-missions.cjs` to test an already-built standalone application against the disposable database and local model fixture. Run the production build and copy `public` and `.next/static` into `.next/standalone` first, as `build:next` does. This avoids development-server recompilation during API checks. Template-derived form edits share the same 60-save manual quota; copying a template does not bypass it.

Production builds enforce TypeScript checks. `npx tsc --noEmit` checks the application, Next configuration and generated route types; the standalone WebSocket example has separate server dependencies and is outside the application typecheck. `reactStrictMode` is enabled.

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


## Offers, outcomes and reuse

The action board can suggest a connection between an open task and an opted-in answer. `src/lib/missions/matching.ts` publishes the rule: normalized shared words, a short English stopword list and explicit aliases such as mending → repair. It does not infer ability, availability or suitability, and it does not rank people. Organizers see eligible suggestions; participants see only their own. An organizer sends an in-app invitation, and only the invited person can accept it. Acceptance claims the task atomically. Withdrawing matching consent withdraws pending invitations. Private form answers remain private; the invitation view exposes shared terms, not the full answers.

Completed tasks with member-provided evidence appear on Accountability only for people who can access their missions. Legacy tasks without evidence are omitted from this view. Formal response requests show recorded response deadlines and whether they are overdue. Process milestone reads follow public/private access, and a completed milestone cannot have all of its evidence removed.

An organizer can save a current adopted plan and/or published form as a personal or community template. They explicitly select and preview the copied text and review it for private details. Templates contain task text and form definitions; answers, participants, source excerpts, events and completion evidence are never copied. A new mission records the sharer's credit and creates unpublished, unadopted template drafts. Community templates can be reused within that community or privately. Deleting a source mission removes its shared templates; missions already adapted from them survive with their credit. Template authors and current community moderators can remove a template through the API.

Suggestion reads are bounded to 100 tasks, 200 opted-in answers and 50 suggestions; invitation history is limited to the latest 100 entries. The interface states when suggestions are limited. The gallery shows up to 50 accessible templates, and Accountability shows up to 50 recent completed tasks with evidence. These are workspace views, not comprehensive audit exports.

## Live staging check

`node scripts/check-staging.cjs` is a portable smoke check for a configured staging host. Set `COSMOGOV_STAGING_URL`, `COSMOGOV_STAGING_EMAIL` and `COSMOGOV_STAGING_PASSWORD` in the execution environment using a dedicated test account. The host needs migrated PostgreSQL, `SESSION_SECRET`, a working AI provider and a function timeout that supports mission runs. Do not put secrets in source control or chat.

The runner makes four real model requests, which may incur provider costs. It creates a private synthetic mission, checks persisted outputs/citations/model metadata, adopts a plan, publishes a form, claims and completes a task with synthetic evidence, saves an answer, exports CSV and closes the form. It deletes its own mission in cleanup and signs out. It never modifies another mission. The disposable integration suite also runs this runner against its local provider fixture; that proves the runner, not a live deployment or real model quality.
