# Cosmogov: everyday democracy

## Product direction

Cosmogov connects a citizen's contribution with a visible decision process: discover → understand → deliberate → decide → follow through. The civic desk is the starting point, rather than a dashboard of game scores. AI supports thought; people make decisions.

The redesign replaces the space-themed interface with an identity based on connected people: a hexagonal mark, forest green, warm paper, a restrained earth-tone palette, Manrope and Inter. The shared theme covers existing app surfaces; primary pages have new layouts and interaction patterns.

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

Existing routes, backend integrations, and PostgreSQL schema are retained. The landing page's Riverside preview is explicitly illustrative. Screenshots under `artifacts/ui-checks` use isolated test fixtures, not customer records. Stock photographs are downloaded locally from Unsplash; the city image depicts a street rather than a claimed customer location.

## Verification

Run `npm ci` and `npm run build:next`. If Turbopack is restricted by the host, `npx next build --webpack` uses the same application source. `node scripts/check-redesign.cjs` runs browser integration checks against an existing local server; it requires Playwright and an installed Chromium (or `CHROMIUM_PATH`). `COSMOGOV_TEST_URL` and `COSMOGOV_TEST_ARTIFACTS` override their defaults. Tests cover navigation, feature tabs, pricing, signup fields, following persistence, proposal filters, vote/comment errors and success, global search, process creation, and desktop/tablet/mobile layouts.

A live PostgreSQL connection is not included in this workspace. Browser tests intercept API requests with fixtures; production data writes and external services therefore need verification against the deployment's configured environment.
