# Cosmogov: everyday democracy

## Product direction

Cosmogov connects a citizen's contribution with a visible decision process: discover → understand → deliberate → decide → follow through. The civic desk is the starting point, rather than a dashboard of game scores. AI supports thought; people make decisions.

The visual identity invites people into community life: an original spark mark, bold Manrope typography, warm cream, vivid violet, coral, sunshine yellow, mint, and sky blue. An original geometric illustration of neighbors appears on the homepage, civic desk, and account entry. Topic colors help people scan proposals; voting choices keep neutral, equally weighted presentation. Decorative entrance motion runs once and respects reduced-motion preferences. The shared theme covers existing app surfaces; primary pages have new layouts and interaction patterns.

The homepage leads with “Big ideas. Local magic.” and conversational language. The civic desk uses a friendly personal greeting, a colorful invitation to contribute, and distinct participation cards. Decision rooms retain quiet reading surfaces, visible rules, and clear labels.

## New behavior

- Civic desk: unvoted open proposals, personal contributions, community memberships, followed ideas, and closed decisions. Counts explicitly describe the latest 50-proposal feed, rather than implying platform-wide analytics.
- Following: user-scoped browser storage, shared between the desk, proposal list, and decision room. No database or cross-device persistence is claimed.
- Proposal discovery: search, topics, status, following, and sort by recency, deadline, or discussion count.
- Decision room: the original proposal brief, voting method, closing time, participation threshold, visibility rules, discussion, voting feedback, and recorded results. A threshold and a closed vote are not presented as approval or implementation.
- Decision record: real closed proposals replace fixed demonstration quality scores.
- Participation process creation: the former inactive action opens a form connected to the existing API. A newly created process starts in Information, with that public visibility explained before submission.
- Workspace navigation: grouped toolsets, persistent access to every existing feature, mobile navigation, notifications, and a keyboard command menu (Ctrl/Cmd+K).
- Account entry: shared accessible signup/login forms, citizen/official selection, password visibility, verification code input, safe dashboard redirects, and explicit submission errors.

## Scope and data

Existing routes, backend integrations, and PostgreSQL schema are retained. The landing page's Riverside preview is explicitly illustrative. Screenshots under `artifacts/colorful` use isolated test fixtures, not customer records. The remaining city photograph is downloaded locally from Unsplash and depicts a street rather than a claimed customer location; the community artwork and spark mark are original SVGs in the source.

## Verification

Run `npm ci` and `npm run build:next`. If Turbopack is restricted by the host, `npx next build --webpack` uses the same application source. `node scripts/check-redesign.cjs` runs browser integration checks against an existing local server; it requires Playwright and an installed Chromium (or `CHROMIUM_PATH`). `COSMOGOV_TEST_URL` and `COSMOGOV_TEST_ARTIFACTS` override their defaults. Tests cover navigation, feature tabs, pricing, signup fields, following persistence, proposal filters, vote/comment errors and success, global search, process creation, and desktop/tablet/mobile layouts.

A live PostgreSQL connection is not included in this workspace. Browser tests intercept API requests with fixtures; production data writes and external services therefore need verification against the deployment's configured environment.

### Recorded validation

The Webpack production build passes and generates all 104 static pages. The browser suite passes 11 interaction/layout checks, and the voting route passes 8 isolated tests. A clean checkout produced 22 TypeScript diagnostic entries; the redesign leaves 16 pre-existing entries, with no new diagnostic file/code pairs. The normal build retains the repository’s existing `ignoreBuildErrors` setting, so passing the production build does not imply a clean repository-wide typecheck.
