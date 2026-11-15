# Cosmogov: everyday democracy

## Product direction

Cosmogov connects a citizen's contribution with a visible decision process: discover → understand → deliberate → decide → follow through. Mission Studio is the starting point for community-directed AI work; the civic desk connects people to ongoing participation. AI supports thought; people make decisions.

The visual identity invites people into community life: an original spark mark, bold Manrope typography, warm cream, vivid violet, coral, sunshine yellow, mint, and sky blue. An original geometric illustration of neighbors appears on the homepage, civic desk, and account entry. Topic colors help people scan proposals; voting choices keep neutral, equally weighted presentation. Decorative entrance motion runs once and respects reduced-motion preferences. The shared theme covers existing app surfaces; primary pages have new layouts and interaction patterns.

The homepage leads with “Big ideas. Meet your team.” and conversational language. Its hero is a working miniature of a mission: a visitor picks one of three example goals, steps through Scout, Bridge, Maker and Studio, sees each draft’s references and open question, and chooses whether a plan or a form joins the mission. The two choices are the same size, and nothing is preselected. Below it, “How a mission moves” is a six-stop path whose dotted trail is drawn by scroll position; each AI step is illustrated as a tool and carries its house rule, and people are illustrated as people. A wall of mission ideas replaces the former stock photograph. All landing text is 12px or larger. Landing styles live in `src/app/landing.css`, loaded by the page only. The civic desk uses a friendly personal greeting, a colorful invitation to contribute, and distinct participation cards. Decision rooms retain quiet reading surfaces, visible rules, and clear labels.

## New behavior

- Civic desk: unvoted open proposals, personal contributions, community memberships, followed ideas, and closed decisions. Counts explicitly describe the latest 50-proposal feed, rather than implying platform-wide analytics.
- Following: user-scoped browser storage, shared between the desk, proposal list, and decision room. No database or cross-device persistence is claimed.
- Proposal discovery: search, topics, status, following, and sort by recency, deadline, or discussion count.
- Decision room: the original proposal brief, voting method, closing time, participation threshold, visibility rules, discussion, voting feedback, and recorded results. A threshold and a closed vote are not presented as approval or implementation.
- Decision record: real closed proposals replace fixed demonstration quality scores.
- Participation process creation: the former inactive action opens a form connected to the existing API. A newly created process starts in Information, with that public visibility explained before submission.
- Workspace navigation: grouped toolsets, persistent access to every existing feature, mobile navigation, notifications, and a keyboard command menu (Ctrl/Cmd+K).
- Account entry: shared accessible signup/login forms, citizen/official selection, password visibility, verification code input, safe dashboard redirects, and explicit submission errors.

## The portal: stickers, the shared garden and starters

- **Stickers** are a small thanks for helping: starting a mission, joining or starting a community, adding a source or a point of view, picking up or finishing a task, answering a form, adopting a plan or publishing a form, opening a proposal, commenting. Fourteen fixed rules in `src/lib/stickers.ts` decide them from counts of a person’s own records, served by `GET /api/stickers`. There is deliberately no sticker for voting or signing, and stickers are not ranked. What they unlock is personal and visible (see "Rewards with real value" below), never extra say in a decision or access to a civic feature. A person’s book is only shown to them. The existing XP, levels and leaderboards are unchanged and separate.
- **The shared garden** shows one flower for each task finished across the missions a person can see, by everyone in them, up to a bed of twelve.
- **The civic desk** shows a sticker strip (collected, next within reach) and the garden. The full book is at `/dashboard/stickers`, in the main sidebar list and the command menu.
- **Explore participation** starts from what people want to do: nine cards in plain words ("Decide something together", "Share out a budget", "Ask what people think"), each opening the tool made for it. The former hero, zero-value statistics and jargon labels are gone, category chips use dark text, and the empty state's button now opens the process dialog.
- **Mission starters** are grouped by kind of group: neighborhood, school, workplace, club or association, local business, city hall. A starter only prefills the new-mission form. The chosen kind is remembered in the browser.
- **Sticker elevation** (ink edge and solid shadow) is now used in the portal for moments of welcome or thanks: the desk welcome panel, stickers, the selected group. Reading and deciding surfaces stay quiet.
- **Text size**: every `font-size` below 12px in `civic.css`, `community.css` and `missions.css` was raised to 12px (218 declarations). Portal styles live in `src/app/portal.css`, loaded by the dashboard layout.

## Scope and data

Existing participation routes and backend integrations are retained. Mission Studio adds PostgreSQL models and a migration, documented in [MISSION_STUDIO.md](./MISSION_STUDIO.md). The landing page's example missions and Riverside preview are fixed, explicitly illustrative content; the landing page never calls a model. Screenshots under `artifacts/colorful` use isolated test fixtures, not customer records. The landing page no longer uses a photograph (`public/images/city.jpg` and `park.jpg` are now unreferenced); the community artwork, the six mission-path illustrations and the spark mark are original SVGs in the source.

## Verification

Run `npm ci` and `npm run build:next`. If Turbopack is restricted by the host, `npx next build --webpack` uses the same application source. `node scripts/check-redesign.cjs` runs browser integration checks against an existing local server; it requires Playwright and an installed Chromium (or `CHROMIUM_PATH`). `COSMOGOV_TEST_URL` and `COSMOGOV_TEST_ARTIFACTS` override their defaults. Tests cover navigation, feature tabs, pricing, signup fields, following persistence, proposal filters, vote/comment errors and success, global search, process creation, and desktop/tablet/mobile layouts.

The broader redesign browser tests use fixtures. Mission Studio additionally has real API and browser tests against disposable PostgreSQL with an isolated model provider; production services still need verification against the deployment’s configured environment.

### Recorded validation

Earlier redesign validation passed 11 browser checks and 8 vote rule checks while retaining 16 pre-existing TypeScript diagnostics. The follow-up work fixes the application diagnostics and removes `ignoreBuildErrors`; production builds now enforce type checking. The standalone WebSocket example is outside the application typecheck because it has its own server dependencies. Current combined verification is recorded in `worklog.md`.

## Rewards with real value and the community map

Every screen keeps the playful identity, and every incentive shows its value where people act.

- **Your home grows.** Stickers grow a personal home on the community map: tent (0), cabin (2), house with a garden (4), clock tower (7), lighthouse (11). Original SVGs in `src/components/stickers/home-svg.ts`. Only the owner sees it, at city level; it changes no permission. It appears on the map, the civic desk and the sticker book (with the full ladder and progress).
- **The earning moment.** `StickerCelebration` (mounted in the dashboard layout) celebrates a newly earned sticker once, anywhere in the workspace: confetti, the sticker peeling on, an impact line in real numbers (`stickerImpact`), and what it unlocked ("Your home grew into a cabin"). "Already celebrated" is per-browser storage; on a first visit, existing stickers are marked seen quietly.
- **Collectible look.** Earned stickers carry a static holographic foil highlight and tilt on hover. Motion respects reduced-motion preferences.
- **"Almost there" nudges.** `StickerNudge` shows the closest sticker for the page and, when the next sticker grows the home, which home it becomes.
- **Civic record.** `/dashboard/record` (`GET /api/record`) is a printable, save-as-PDF record of a person’s own contributions: tasks finished with mission and finish date, estimated time from each task plan, missions and communities started, proposals opened, stickers. Useful as proof of volunteering. Its footer states that times are plan estimates, votes and signatures are never listed, and Cosmogov does not verify identity.
- **New stickers.** *On the map* (choose a home city) and *Local spark* (open the very first proposal in a city).
- **Community map.** Open-source basemap (OpenFreeMap via MapLibre in Leaflet). Activities are sticker pins in topic tints that pop in once; pins sharing a city point fan out in a ring; clusters are sunshine stickers. "Plant your flag" saves a home city through `/api/geo/set-location` (browser geolocation is shown for the visit only and never saved). The shared garden blooms on the map: one flower per community, sized by tasks finished in missions the person can see (`GET /api/geo/blooms`). The side panel offers your home, "Near you" (within 100 km), the nudge, filters, and an inviting empty state with "Start a mission" and "Open a proposal". Popup text written by people is escaped. City search ranks exact names and capitals first.

## Mission workspace clarity

Mission pages now put people alongside AI work: a contribution strip shows the actual supplied context, tasks currently claimed, and tasks members marked done. Contributor initials and counts derive from mission inputs, task ownership and form responses; they do not imply a count of community members or verified outcomes. Each card opens the relevant mission section.

AI authorship remains visible after adoption. Drafts carry a compact review badge; accepted plans and published forms show the accepting person's current name and acceptance date. Accepted plans use a quiet mint border. A changed-context message distinguishes an earlier adopted snapshot from a draft that needs regeneration. Source references are open by default, cited from findings, and highlighted when followed. Questions use peach; answer visibility uses a sky notice beside submission.

Mission labels have a 12px minimum and primary reading text is at least 14px across mobile and desktop layouts. Key navigation and task controls have 44px minimum touch targets. The small illustrative homepage preview retains its display scale.

This pass was verified with the Webpack production build, 21 mission integration checks against disposable PostgreSQL and an isolated model provider, 11 broader UI checks against the production build, and 12 session/voting checks. Mission layouts were checked at 375, 768, 1024 and 1440px. Screenshots are local, ignored verification artifacts under `artifacts/missions`; they are not included in the repository.

## Editable mission forms

The form editor continues Claude’s landing and portal redesign: a lilac invitation with the shared scalloped form sticker, white question cards, familiar violet controls, and a quiet live layout preview. At desktop widths the questions and preview sit side by side; on mobile they stack inside one scrollable dialog with the save controls kept visible. Labels remain visible, all ordering/removal controls have accessible names and 44px targets, and changes can be discarded explicitly.

Managers can build a form by hand or revise an AI draft, including title, introduction, text/choice questions, options, required answers and order. Saving creates a new draft; publishing is a separate review step. Authorship labels distinguish community-written forms from AI-assisted and community-edited AI forms. Revising a published form leaves its original version and answers intact.

Verification for the combined redesign and form editor: Webpack production build passed; 26 real-API/disposable-database/browser mission checks, 13 browser regression checks against the standalone production build, and 19 sticker/session/voting rule checks passed. The illustrated homepage path is visited before full-page screenshots so its scroll-triggered artwork is captured in its visible state. Local screenshots are under `artifacts/missions` and `artifacts/editor-regression` and remain ignored by Git. At that point the typecheck still reported 16 pre-existing diagnostics; the later verification cleanup resolves them for the application.

## Mission controls and evidence

Forms show visibility and availability terms before submission. Organizers choose those terms in the editor; new forms start with organizer-only answers and 90 days. A review panel flags possible sensitive questions, requests a stated need, and restricts flagged forms to organizer-only answers. Close, unpublish, reopen and export controls sit beside the reviewed form. Archived answers remain available only to the respondent and permitted organizers.

Task completion opens a small evidence dialog rather than immediately marking work done. Completion notes, optional source links and recent actor history sit with each task. The mission settings dialog requires the exact mission title before permanent deletion. These surfaces use the existing calm cards, violet controls, peach review panels and sky privacy notices.


## Community coordination

Task invitations use the existing lilac reading surface, quiet white cards and a clear consent sentence. The task board stays human-directed: a shared-word suggestion becomes an invitation, then a task claim only after the participant accepts. Members see their own suggestions and invitations, while organizers can coordinate opted-in offers. Empty states explain how an offer becomes useful work.

The Mission Studio template gallery credits the people who shared the starting point. Saving a template uses an explicit content-selection and preview dialog; reuse opens the existing mission creation flow and creates drafts that still need review. Completion notes appear on the existing Accountability page with a direct path to the mission and original evidence. These additions keep Claude's palette, typography, illustrations, stickers and garden.
