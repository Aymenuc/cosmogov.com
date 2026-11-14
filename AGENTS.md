# Cosmogov — instructions for the next agent

Read this file before changing anything. It records what the product is, how the
redesign is built, the exact design system, the defects that must be fixed first,
and the roadmap in build order.

Everything here was checked against the code on `redesign/civic-experience` at
commit `cf56cb8` (14 Nov 2026) by reading it. Nothing was run against a live
database or a live model. Where a claim was not verified, it says so.

## 0. Start here: where the code stands

The newest commit is `cf56cb8`, "Build community-directed AI mission studio with
shared plans and tools" (Codex, 14 Nov 2026). It is on GitHub. It did two things.

**It added Mission Studio.** Read `MISSION_STUDIO.md` first; this is the short version.

- A **mission** is a goal a person or a community wants done. It lives at
  `/dashboard/missions`, with a public, clearly illustrative demo at `/missions/demo`.
- Members add **contributions**: perspectives, constraints and sources (up to 40
  per mission).
- A mission manager can run four **AI steps**, each on request:
  **Scout** (research), **Bridge** (perspectives), **Maker** (a plan of tasks) and
  **Studio** (a participation form). These are four prompts to one configured
  model. They are not autonomous agents and take no external action.
- Every output is an **AI draft** that lists findings with references, and
  questions it could not answer. A finding that cites an unknown reference causes
  the whole output to be rejected by code.
- A manager **adopts** a plan (its tasks go to the action board) or **publishes**
  a form (members can respond). Adoption is refused if contributions changed
  after the draft was made.
- Members **claim, release and complete tasks**, and **answer published forms**
  (one response each, which they can update or delete).

**It replaced the forgeable session cookie** with HMAC-signed, expiring tokens
(`src/lib/session-token.ts`). Production now needs `SESSION_SECRET`. See 6.1.

How this file was checked against that commit: every mission file was read, and
`node --test scripts/check-session.cjs` was run (4 of 4 pass). The mission test
suite (`scripts/check-missions.cjs`), the build and a live model were **not** run.
Section 7.0 records the review, line by line.

Related files: `MISSION_STUDIO.md` (the mission workspace), `DESIGN.md` (what the
redesign changed and how it was verified), `worklog.md` (history of earlier
agents; not updated for missions), `agent-ctx/` (notes per older feature).

---

## 1. Product direction

Cosmogov is a civic participation platform. One sentence to hold on to:

> A citizen's contribution is connected to a visible decision:
> **discover → understand → deliberate → decide → follow through.**

Three rules follow from that and override any feature idea:

1. **AI supports thought; people decide.** A model may summarise, translate,
   cluster and explain. It never votes, ranks people, or settles an outcome.
2. **A result must be checkable by someone who does not trust us.** Counts,
   lotteries and signatures are computed by published rules, not by a model and
   not by hidden code paths.
3. **Never present more than is true.** A threshold reached is not approval. A
   closed vote is not implementation. Demonstration content is labelled as such.

The product now has two threads, and both matter:

- **Missions** are the current thread (section 0 and 7.0). A community names
  something it wants done and adds what it knows. On request, AI researches it,
  maps the perspectives, drafts a plan of tasks and drafts a form to gather what
  is needed. People choose what to adopt. This is where the three rules are
  tested most directly: the AI drafts, shows its references and what it does not
  know, and a person decides.
- **Provable integrity** is the thread underneath. The platform already has
  proposals, participatory processes, budgets, initiatives, binding proposals,
  legislation with amendments, surveys, assemblies, meetings, sortition, an
  accountability tracker, a map, chat, AI debate agents and civic games. What
  those lack is results a sceptic can check. Sections 6 and 7.1 onward build that.

Do not add further modules beyond missions until the defects in section 6 are fixed.

---

## 2. Stack and commands

| Area | What is used |
|---|---|
| Framework | Next.js `^16.1.1`, App Router, React 19, `output: "standalone"` |
| Language | TypeScript 5. `next.config.ts` sets `typescript.ignoreBuildErrors: true` |
| Styling | Tailwind CSS 4 via `@import "tailwindcss"` plus four hand-written stylesheets (section 5.7) |
| Components | shadcn/ui (48 files in `src/components/ui`), Radix, `lucide-react` icons, `framer-motion` |
| Data | Prisma `^6.11.1` on Supabase Postgres. Two migrations: `20260425120000_init` and `20261114120000_mission_studio` |
| Auth | HMAC-signed session cookie: `src/lib/session-token.ts` and `src/lib/auth.ts`. Needs `SESSION_SECRET` in production. `next-auth` is installed but **not used anywhere** |
| AI | `src/lib/ai-completions.ts`, OpenAI-shaped chat completions through the Z AI SDK or an NVIDIA-compatible endpoint. Mission prompts and optional web search are in `src/lib/missions/ai.ts` |
| Maps | Leaflet and `react-leaflet` |
| Email / push | `src/lib/email.ts` (stub, SMTP or Resend), `src/lib/push-notifications.ts` (VAPID) |

```bash
npm ci
npm run dev               # port 3000, writes dev.log
npm run build:next        # next build + copy static into standalone
npm run build             # prisma migrate deploy, then build:next — needs DATABASE_URL
npm run lint
node --test scripts/check-session.cjs scripts/check-voting.cjs   # session signing and vote rules, no database
node scripts/check-redesign.cjs        # Playwright UI checks against a running server
node scripts/check-missions.cjs        # mission API and browser tests on a disposable PostgreSQL
```

Notes on these commands:

- `check-redesign.cjs` needs a server already running, Playwright and Chromium.
  `COSMOGOV_TEST_URL` and `COSMOGOV_TEST_ARTIFACTS` override its defaults. It
  intercepts API calls with fixtures, so it proves the interface, not the data layer.
- `check-missions.cjs` starts its own PostgreSQL, applies both migrations, starts
  the real application and uses a local model fixture; it never calls a paid
  model. Install `embedded-postgres` outside the repository and pass its module
  path as `COSMOGOV_EMBEDDED_PG`. It also needs Playwright and Chromium.
- If Turbopack is blocked on the host, `npx next build --webpack` builds the same source.
- A passing build does **not** mean the code typechecks, because build errors are
  ignored. Run `npx tsc --noEmit` and compare against the baseline in `DESIGN.md`
  (16 pre-existing diagnostics). Do not add new ones.
- There is no unit-test runner configured. New logic in section 7 must arrive with
  tests. Follow the pattern in `scripts/check-voting.cjs` or add Vitest, and say
  which you chose in the PR.
- Environment variables are listed in `.env.example`. Never commit `.env`.
  `SESSION_SECRET` (32 or more random characters) is required in production.
  `MISSION_WEB_SEARCH=1` turns on web search for the Scout step and only works
  with the Z AI SDK, not with an OpenAI-compatible endpoint.
- AI runs are synchronous. The run route sets `maxDuration = 120`; the host must
  allow a request that long.

**This is not the Next.js in your training data.** Before writing routing, caching
or request-handling code, read the matching guide in `node_modules/next/dist/docs/`.
In particular, Next 16 renames the `middleware` convention to `proxy`; this repo
still has `src/middleware.ts`. Check the docs before touching it.

---

## 3. Repository map

```
src/app/page.tsx                      landing page (602 lines)
src/app/auth/{login,signup}           account entry, uses components/AuthExperience.tsx
src/app/dashboard/layout.tsx          workspace shell: sidebar, top bar, command menu
src/app/dashboard/page.tsx            the civic desk
src/app/dashboard/missions/           Mission Studio: list page and [id] = the mission room
src/app/missions/demo/                public, illustrative mission demo (no login, no AI)
src/app/dashboard/proposals/          list, new, [id] = the decision room, [id]/edit
src/app/dashboard/participation/      processes, budget, initiatives, binding-proposals,
                                      legislation, surveys, assemblies, meetings,
                                      sortition, accountability
src/app/dashboard/{decisions,chat,assembly-hall,explore,pulse,analytics}
src/app/dashboard/{ai-agents,assistant,games,leaderboards,reputation}
src/app/dashboard/{gov-portal,admin,organizations,cosmic-map,search,settings}
src/app/api/**/route.ts               92 route handlers, one folder per resource
src/app/api/missions/                 missions, contributions, runs (AI steps), accept,
                                      tasks, tools/[runId]/responses
src/app/{globals,civic,community,missions}.css   the four style layers
src/components/                       Brand, SiteHeader, Footer, CommonsArt, ProposalCard,
                                      CommandMenu, StartProcessDialog, WorkspaceContext,
                                      AuthExperience, OfficialResponseBadge, ui/
src/components/missions/              MissionRoom (1,329 lines), MissionToolForm, MissionPreview
src/lib/missions/                     types (the four steps), validation (zod schemas),
                                      ai (prompts, search), server (access rules), demo
src/lib/session-token.ts              signing and verifying session tokens
src/lib/auth.ts                       password hashing, createSession, getSession
src/lib/civic.ts                      CivicProposal type, isOpen(), deadlineLabel(), voteLabel
src/lib/categories.ts                 the 10 topic categories and legacy mapping
src/lib/ai-completions.ts             the only place that calls a model
prisma/schema.prisma                  55 models (5 for missions)
scripts/                              migrate-deploy, check-session, check-voting,
                                      check-redesign, check-missions
```

Workspace navigation (defined in `src/app/dashboard/layout.tsx`):

- Main links: My civic desk, Mission studio, Explore participation, Proposals &
  voting, My communities, Community map, Accountability.
- The civic desk's main call to action is now "Start a mission".
- Tool groups: **Participation tools**, **Community & insights**, **Learn & grow**.
- Every existing feature must stay reachable. Add new pages to a group; do not
  remove entries.

---

## 4. Working rules

- **Branch.** `redesign/civic-experience` is the integration branch, and Codex
  has been committing to it directly. Always fetch it before starting, and never
  rewrite its history. For new work, cut a branch from its latest commit and open
  a draft pull request back into it. Do not push to `main`.
- **Push what you commit.** A commit that exists only in one agent's workspace
  cannot be reviewed or continued by anyone else. End every working session with
  the branch pushed and its commit id checked on GitHub.
- **One concern per pull request.** A security fix does not travel with a restyle.
- **Schema changes are migrations.** `npm run build` runs `prisma migrate deploy`,
  so use `npx prisma migrate dev --name <what>` and commit the SQL. Do not use
  `prisma db push` for anything that will ship.
- **Authorise in the route handler.** `src/middleware.ts` skips `/api/*` and cannot
  read the role. Every handler checks the session and the role itself.
- **Prefer a rule to a prompt.** If something can be written as a function with a
  test (a tally, a quota, a threshold), it must not be a model's judgement.
- **Keep all AI calls behind `chatCompletionsCreate`.** Do not import a provider
  SDK in a route or a component. The one existing exception is web search in
  `src/lib/missions/ai.ts`; do not add a second.
- **Do not invent data.** No fabricated statistics, testimonials, customer names
  or locations. Illustrative content carries a visible "example" label, as the
  landing page preview already does.
- **Update the docs you change.** `DESIGN.md` for interface behaviour, this file
  for rules and roadmap status, `worklog.md` for a dated entry of what you did.
- **Report honestly.** If a check could not be run (no database, no browser), say
  so in the PR instead of implying it passed.

---

## 5. Design system

The redesign replaced a dark "cosmic" theme with a warm, bright community
identity. Follow this section exactly; do not introduce a second visual language.

### 5.1 Principles

1. **Bright at the edges, quiet in the middle.** Landing, civic desk, cards and
   navigation use colour. Reading and deciding surfaces (the decision room, vote
   options, legal text, results) are white or near-white with dark ink.
2. **Colour states something.** Topic, status, emphasis. It is never decoration
   inside a decision surface.
3. **Voting choices are visually equal.** No option is green or red, larger, or
   pre-selected. Selected state is the same violet for every option.
4. **Friendly, not childish.** Rounded shapes, one hand-drawn-feeling
   illustration style, plain conversational copy. No mascots, no confetti on votes.
5. **Motion runs once and can be turned off.** See 5.6.

### 5.2 Core colours

Defined in `src/app/civic.css` (`--civic-*`), `src/app/community.css`
(`--community-*`) and `src/app/globals.css` (shadcn tokens). Contrast ratios
below were computed with the WCAG formula.

| Role | Token | Hex | Use | Contrast |
|---|---|---|---|---|
| Ink | `--civic-ink`, `--foreground` | `#29223d` | Body text, headings, hard outlines | 14.85 on paper |
| Paper | `--civic-paper`, `--background` | `#fffdf7` | Page background (warm cream) | — |
| Card | `--card` | `#ffffff` | Cards, reading surfaces | — |
| Workspace | — | `#faf8fe` | App shell background, card action strips | — |
| Violet | `--civic-accent`, `--primary`, `--ring` | `#6741d9` | Primary buttons, links, focus ring, selected state | 6.19 on paper; white on it 6.30 |
| Violet deep | — | `#5932c4` | Button hover, active nav text | 6.50 on lilac |
| Violet shadow | — | `#4c2aa7` | The solid shadow under primary buttons | — |
| Lilac | `--community-lilac`, `--accent` | `#eee6ff` | Soft violet fill: active nav, welcome panel, selected option | — |
| Lilac soft | `--secondary`, `--muted` | `#f2edfb` | Section backgrounds, scrollbar track | — |
| Muted text | `--muted-foreground` | `#706779` | Secondary text | 5.29 on paper; **4.46 on lilac — fails AA for small text** |
| Line | `--civic-line` | `#e6e0ee` | Borders and dividers | — |
| Sun | `--civic-sun` | `#ffcf4d` | Highlight shapes, the "light" button, labels | Ink on it 10.27 |
| Coral | `--civic-coral` | `#ff785f` | The dot in the logo, underline flourishes, illustration | **2.55 on paper — never use for text** |
| Rust | `--civic-orange` | `#b8422d` | Coral's text-safe partner: warm icons and links | 5.36 on paper |
| Success | — | `#28745b` | Open status, confirmations | 5.52 on paper |
| Destructive | `--destructive` | `#bf4054` | Errors, destructive actions | 5.06 on paper |
| Teal | `--chart-2` | `#167b83` | Charts, secondary data | 4.92 on paper |
| Amber | `--chart-4` | `#916500` | Charts, warnings | 5.08 on paper |

Chart series order: `#6741d9`, `#167b83`, `#8b47c9`, `#916500`, `#bf4054`.

Rules:

- Sun text on violet is 4.28. Use it only for large display words (as in the final
  call to action), never for body or labels.
- On a lilac or other tinted fill, use ink `#29223d` or the tint's paired ink
  from 5.3, not muted grey.
- Do not add a new hue. If a new state needs colour, reuse a tint pair from 5.3.

### 5.3 Tint pairs (background + ink)

Every tinted surface uses one of these pairs. All pass AA for normal text.

| Name | Background | Ink | Contrast | Topics that use it |
|---|---|---|---|---|
| Lilac | `#eee6ff` | `#6741d9` | 5.22 | default, political, culture |
| Mint | `#dff5e8` | `#28745b` | 4.91 | environment, technology |
| Sky | `#e1f3ff` | `#226784` | 5.53 | infrastructure, education |
| Sun | `#fff0c3` | `#7b570c` | 5.76 | economic, security |
| Peach | `#ffe7df` | `#a44231` | 5.22 | social, health |

Topic colour is applied by `data-topic` on `.proposal-card`, which sets
`--topic-bg` and `--topic-ink`. The ten category ids live in
`src/lib/categories.ts`. To colour a new card type, set the same two custom
properties; do not hard-code hex in a component.

Other fixed uses: open status chip `#e1f4e8` / `#256449`; assistant and AI
callouts `#fff0c3` with border `#f2dd9d` and text `#745214`; civic desk stat
tiles in the order lilac, mint `#e0f3ea`, sun `#fff0c3`, peach `#ffe6df`.

### 5.4 Typography

Loaded from Google Fonts in `src/app/layout.tsx`.

| Family | Weights | Use |
|---|---|---|
| **Manrope** | 400–800 | All headings, brand wordmark, large numbers |
| **Inter** | 400, 500, 600 | Body, forms, navigation |
| **IBM Plex Mono** | 400, 500 | Codes, hashes, receipts, identifiers |

- Headings: letter-spacing `-0.02em`, line-height `1.1`. Section headings on the
  landing page use weight 750 and `-1.8px`.
- Hero headline: `clamp(64px, 6.4vw, 94px)`, weight 800, line-height 1.04,
  letter-spacing `-5.2px`. The emphasised word is violet with a coral curved underline.
- App page title: 30px / 750 (26px under 760px). Section title: 19px / 750.
  Card title: 16px / 750. Stat number: 34px / 800.
- Body: 15–16px, line-height 1.85 for marketing copy.
- Eyebrow labels: uppercase feel, 700 weight, letter-spacing about 1.3px.
- Emphasis inside headings uses `<em>` restyled as upright Manrope 800 in colour.
  Do not use serif or italic.

### 5.5 Shape, borders and elevation

- Base radius `--radius: 0.875rem` (14px). Cards 18px. Panels 22–28px. Inputs
  and vote options 12px. Buttons, chips and tags are full pills (`100px`).
- **Two elevation styles, do not mix them on one surface:**
  - *Sticker* (landing and illustration only): `2px solid #29223d` border with a
    solid offset shadow such as `8px 10px 0 #29223d`, slight rotation (2–5°).
  - *Quiet* (the app): `1px` line border and a soft shadow such as
    `0 8px 22px #39225e0c` on hover, with a `translateY(-3px)` lift.
- Primary button: violet fill, white text, pill, `box-shadow: 0 4px 0 #4c2aa7`.
  Hover `#5932c4` with a 6px shadow. Active moves down 2px with a 1px shadow.
  Minimum height 50px (41px for `.small`).
- Outline button: transparent, border `#d7cbe8`, hover fill lilac, no shadow.
- Light button: sun fill `#ffcf4d`, ink text, shadow `0 4px 0 #c99123`.
- Focus: `outline: 2px solid #6741d9; outline-offset: 4px` on `:focus-visible`.
  Never remove it.

### 5.6 Motion

- Decorative entrance animation (`idea-pop`, 0.65s) runs once, only under
  `prefers-reduced-motion: no-preference`.
- Interactive transitions are 0.2s on transform, shadow and background.
- A global rule reduces all animation and transition to near zero under
  `prefers-reduced-motion: reduce`. Keep it.
- No looping animation on any page where a person reads or votes.

### 5.7 CSS architecture

Four stylesheets load in this order in `src/app/layout.tsx`:

1. `globals.css` — Tailwind import, shadcn tokens, and **legacy utilities** from
   the dark theme (`.glass-card*`, `.glow-*`, `.text-gradient*`, starfield,
   map markers). The legacy class names are kept so old pages do not break; most
   are neutralised to flat cards.
2. `civic.css` (about 4,300 lines) — structure and layout for every redesigned
   surface. Breakpoints: 1200, 1150, 1000, 760, 550, 480px.
3. `community.css` (about 880 lines) — the colour and personality layer. It
   overrides `civic.css` and is where colour decisions live.
4. `missions.css` (about 1,850 lines) — everything for Mission Studio, layout
   and colour together. Keep mission styles here; see 5.12 for what to fix in it.

Rules for new work:

- Layout and spacing go in `civic.css`. Colour, radius, weight and decoration go
  in `community.css`. Tokens go in `:root`.
- Use semantic class names in the existing style (`.decision-section`,
  `.desk-stats`). Tailwind utilities are fine inside shadcn components.
- Do not use the legacy `.glass-card`, `.glow-*`, `.text-gradient*`, `.cosmic-*`
  classes in new code. When you touch a page that uses them, migrate it.
- `tailwind.config.ts` wraps tokens in `hsl(var(--x))` while the tokens are hex.
  It appears to be unused under Tailwind 4 (no `@config` directive). Verify
  before relying on it, and prefer the `@theme inline` block in `globals.css`.

### 5.8 Brand and illustration

- **Mark** (`src/components/Brand.tsx`): a six-ray spark drawn with 7px rounded
  strokes in `currentColor` (violet), with a coral `#FF785F` centre dot. 40×40 viewBox.
- **Wordmark**: lowercase `cosmogov` in Manrope 800, letter-spacing `-1.5px`,
  followed by a coral full stop. On dark or violet backgrounds use the `light` variant.
- **Illustration** (`src/components/CommonsArt.tsx`): original geometric SVG of
  neighbours. Palette: `#302248`, `#6741D9`, `#28745B`, `#FFCF4D`, `#FF785F`,
  `#E8DFFF`, `#B8E9CC`, `#FFFDF7`, skin tones `#D99770` and `#764A3E`. New
  illustrations use this palette, flat fills, rounded geometry and no gradients.
- Photos: only `public/images/city.jpg` and `park.jpg`. Do not caption a stock
  photo as a real customer place.
- PWA manifest: `theme_color #6741d9`, `background_color #fffdf7`.

### 5.9 Voice

- Plain, warm, second person. "Have your say", "View decision", "Start a mission".
  The landing headline is now "Big ideas. Meet your team."
- **"AI team" is a figure of speech; keep it honest.** Scout, Bridge, Maker and
  Studio are four requested steps on one model. Never describe them as agents
  that act on their own, remember people, contact anyone or decide anything.
- Name the rule beside the action: voting method, closing time, threshold and who
  can see what appear before a person votes or signs.
- State outcomes precisely: "Voting ended", "Threshold reached", "Awaiting official
  response". Never "Approved" or "Done" unless a record says so.
- Errors say what happened and what to do next. No blame, no jargon.
- Reading level: aim for text a 14-year-old can follow.

### 5.10 Accessibility requirements

Target WCAG 2.2 AA. For every interface change:

- Text contrast at least 4.5:1 (3:1 for text 24px and larger). Check tinted fills.
- Every control reachable and operable by keyboard, with a visible focus ring.
- Touch targets at least 44×44px on mobile.
- Icon-only buttons have an `aria-label`; toggles expose `aria-pressed`.
- The skip link and `#main-content` landmark stay in place.
- Test at 1440, 1024, 768 and 390px wide. Measure layout from the DOM; a
  screenshot is evidence of a result, not a measurement.

### 5.11 Known design debt (fix as you pass, each in its own PR)

- **Text below 11px.** `civic.css` has 79 declarations at 8–10px and
  `community.css` has 6. Raise labels to at least 12px, body to at least 14px.
- **The map is still dark.** `.cosmic-marker`, `.cosmic-cluster-marker`,
  `.cosmic-popup` and the Leaflet controls in `globals.css` use near-black
  backgrounds with dark ink text set by the redesign, so popups are unreadable.
  Restyle to white cards with the tint pairs.
- **Leftover blue.** Scrollbar thumb and `::selection` use `rgba(45,107,255,…)`.
  Change to violet at the same opacity. `.cosmic-badge` is also blue.
- **Muted text on lilac** (4.46:1) appears in the welcome panel and stat tiles.
- **No dark mode.** `darkMode: "class"` is configured and `next-themes` is
  installed, but only light tokens exist. Either build a real dark token set or
  remove the dependency. Do not ship a half theme.
- **Names.** Routes and classes still say `cosmic-map`, `CosmicReputation`,
  "Cosmic" in places. User-facing labels are already updated; leave route names
  until there is a redirect plan.
- **`DESIGN.md` mentions `artifacts/colorful` screenshots** that are not in the repository.

### 5.12 Mission Studio: how it looks now, and what to bring into line

What exists (`src/app/missions.css`, loaded last, about 1,850 lines):

- **Step colours** follow the tint pairs: Scout mint, Bridge peach, Maker lilac,
  Studio sun. Keep this mapping everywhere a step is shown.
- **An AI draft is labelled** "AI DRAFT · REVIEW WITH YOUR COMMUNITY" with a
  spark icon, and gains an "Adopted" mark once accepted. The demo says
  "ILLUSTRATIVE AI DRAFT".
- **Questions the AI could not answer** sit in a sun block (`#fff3ce`, heading
  `#775718`) directly under the findings.
- **References** are numbered beside each finding and listed in a collapsed
  "References behind this draft" panel, with a note that a reference identifies
  the supplied context and does not prove the claim.
- **The adopt bar** is lilac with one primary button ("Adopt this plan" or
  "Publish this tool") and a confirmation dialog that says what adopting does
  and does not do.
- **The generated form** is a soft lilac card (`#f7f3ff`, border `#ded1f3`,
  17px radius) with a visible label above each field, a `select` for choices and
  a `textarea` for text. Above the button it says: "Your name and response are
  visible to people with access to this mission."

Bring into line (each is a small pull request):

- **The draft label is 8px.** It is the most important label on the page. Make
  it at least 12px, and give the whole draft the AI callout treatment from 5.3
  (`#fff0c3`, border `#f2dd9d`, text `#745214`) until it is adopted.
- **Small text.** `missions.css` has 42 declarations at 7 to 10px (3 at 7px, 6 at
  8px, 8 at 9px, 25 at 10px). Raise labels to 12px and body to 14px.
- **Two greys fail contrast**: `#8a7895` (3.97 on paper, 4.04 on white) and
  `#887594` (4.11, 4.18), both used at 10 to 11px for effort estimates, source
  details, empty columns, field help and response details. Replace with
  `--muted-foreground #706779` or darker. `#796a86` passes on white (4.98) but
  not on lilac (4.12).
- **About 45 distinct hex values**, many a shade away from a token (`#fff3ce`,
  `#fff3cd`, `#fff1d5`, `#fff1d0` beside the token `#fff0c3`). Replace
  near-duplicates with the tokens in 5.2 and 5.3.
- **The selected-step outline `#9a7be2`** is 3.27 on paper; that is acceptable
  for a border but pair it with the existing `aria-pressed` and a text cue.
- **Task status** should be text plus a tint: open lilac, claimed sun, done mint.
  Never colour alone.
- **Breakpoints** are only 1150 and 760px. Check the workbench at 1024 and 390px.
- **Error text in forms** uses `.form-error`; keep `#bf4054` with an icon and a
  sentence that says how to fix it.
- Keep one primary button per form, 44px touch targets, and full keyboard use.

---

## 6. Fix before anything else

These are defects in the current code. A civic platform that asks people to trust
its results cannot ship them. Do them in this order, each as its own pull request
with tests. The repository is public, so treat every value in source as known.

### 6.1 Sessions — fixed in `cf56cb8`, with follow-ups

The unsigned cookie is gone. `src/lib/session-token.ts` issues
`v1.<payload>.<HMAC-SHA256>` tokens with a 30-day expiry, compares signatures in
constant time, and rejects malformed, oversized, expired and future-dated tokens.
`getSession()` verifies the token and then loads the user, so a deleted user loses
access. `scripts/check-session.cjs` covers this (4 tests, passing).

What you must do and know:

1. **Set `SESSION_SECRET` before deploying.** It must be at least 32 random
   characters and identical on every worker. In production, sign-in and sign-up
   fail without it. Generate one with `openssl rand -base64 48`. Never commit it.
2. **Everyone is signed out on deploy.** Old cookies no longer verify. That is intended.
3. **There is no revocation.** Tokens are stateless: logout only clears the
   cookie, a copied token works until it expires, and changing a password does
   not end other sessions. Follow-up: add a `sessionVersion` integer on `User`,
   put it in the token, bump it on password change and on "sign out everywhere",
   and reject tokens with an older version.
4. **30 days is long for a civic platform.** Consider 14 days with renewal on use.
5. Rotating `SESSION_SECRET` signs everyone out; document that as the emergency
   response to a suspected leak.

### 6.2 Open seed and setup routes — critical

- `GET /api/seed` has no authentication. On an empty database it creates admin
  accounts with a password that is hard-coded in source.
- `POST /api/legislation/seed` and `GET /api/geo/seed-demo` have no authentication.
- `src/app/api/auth/signup/route.ts` grants the `gov_official` role to anyone who
  submits one of several verification codes that are hard-coded in source.

Steps: move seeding to a script run from the command line (`scripts/seed.cjs`)
and delete the HTTP seed routes, or make them return 404 unless
`NODE_ENV !== 'production'` **and** the caller is a super admin. Replace the
official codes with single-use, expiring invitations stored hashed in the
database and issued by an admin (the `Invitation` model already exists). Rotate
anything that was ever deployed with the old values.

### 6.3 Votes and emails are exposed

Since 6.1 was fixed, a leaked user id can no longer be turned into a session,
but this is still a privacy defect.

`GET /api/proposals` returns each creator's email and every vote as
`{ voterId, option }`, including for proposals marked `isAnonymous`. The vote
row also stores `voterId` for anonymous proposals, so the flag only hides names
in the interface.

Steps: stop returning emails. Return aggregate counts plus the caller's own vote
only. Decide and document what "anonymous" means (section 7.4 builds the proper
version); until then, relabel the option as "Hide voter names" so it promises
only what it does.

### 6.4 Tallies that can be gamed

- **Budget votes** (`src/app/api/participation/budget/route.ts`): any positive
  amount is accepted, with no per-voter limit and no check against the process
  budget. Enforce a per-voter allowance in one database transaction.
- **Signatures** (`src/app/api/binding-proposals/[id]/sign/route.ts`): the count
  and the `threshold_reached` status use unverified signatures, and the
  read-then-increment sequence can double count under concurrent requests. Count
  from rows inside a transaction and count only `verified` signatures toward a
  binding threshold.
- **Ranked choice**: `votingType` offers `ranked_choice`, but the vote route
  accepts one option string. Either hide the option until 7.4 ships or implement it.
- **XP for voting**: `+10 XP` per vote rewards volume. Remove XP from votes,
  signatures and comments. Reputation must never weight a vote.

### 6.5 Basic hardening

- Add rate limiting to login, signup, vote, sign, comment and AI routes.
- Validate every request body with `zod` (already a dependency).
- Check role in every `gov-portal` and `admin` handler; add a test per route.
- Turn `reactStrictMode` back on, and plan to remove `ignoreBuildErrors` once the
  16 existing diagnostics are fixed.

---

## 7. Roadmap, in build order

Each item lists what to build, the data it needs, and when it is done. Keep the
order: later items depend on the trust established by earlier ones.

### 7.0 Mission Studio — built; review results and what to do next

Built in `cf56cb8`. This is the review of that code against the product rules.
**Pass** means the code does it. **Gap** means it does not yet.

**The form definition**

- Pass — The form is data, validated by `zod` (`toolSchema` in
  `src/lib/missions/validation.ts`). Only `text` and `choice` fields exist. No
  generated code runs anywhere.
- Pass — Limits are enforced in code: 1 to 6 fields, ids `f1` to `f6`, labels to
  120 characters, 2 to 8 unique options per choice.
- Pass — A form takes responses only after a manager publishes it, and tasks
  exist only after a manager adopts the plan. `acceptedAt` and `reviewedBy` are stored.
- Pass — A published form is an immutable run. A new form is a new run, and
  responses are tied to the run they answered.
- Gap — A person cannot edit a draft form, add or remove a field, or build one
  by hand. The only choices are publish as drafted or run Studio again.
- Gap — A published form cannot be closed or unpublished.
- Gap — "Do not ask for names, contact details, addresses, health data or
  political affiliations" exists only as an instruction in the prompt. Nothing in
  code checks field labels, and a free-text answer can hold anything.

**The AI draft**

- Pass — Model calls go through `chatCompletionsCreate`. One exception to know:
  web search calls the Z AI SDK directly in `src/lib/missions/ai.ts`.
- Pass — Mission content is sent as JSON data under a system prompt that says it
  is untrusted. Output is parsed by schema and never used as HTML (no
  `dangerouslySetInnerHTML` in mission components). Source links must be `http`
  or `https` without credentials and open with `rel="noopener"`.
- Pass — Every finding must cite a known source id or the whole output is
  rejected. Note what this proves: the excerpt exists, not that the finding
  follows from it. The interface says so; keep that sentence.
- Pass — Unanswered questions are stored with the draft and shown.
- Pass — A failed run is recorded with a clear message and never replaced by
  canned content. Contributions are kept.
- Gap — The run does not record which model or prompt version produced it.
- To decide — Contributor names are sent to the model with each contribution
  (`author` in the evidence). Either drop names before the call or say so in the
  privacy notice.

**Responses**

- Pass — The submit route checks the session and mission access, validates
  answers against the stored form, and rejects unknown fields.
- Pass — One response per person per form, enforced by a database constraint. A
  person can update or delete their own.
- Pass — Responses are not sent to the model.
- Pass — No points or reputation are awarded anywhere in missions.
- To decide — **Every member with access to the mission sees every response with
  the author's name**, not only organisers. The form says so above the button.
  This fits a skills board; it does not fit anything sensitive. See question 5.
- Gap — The form does not say how long answers are kept.
- Gap — No export of responses for organisers.
- Gap — No route deletes a mission, so the cascade that would remove its
  responses can never run.
- Gap — No rate limit on responses or contributions (AI runs are limited to 12
  per person per hour, and contributions are capped at 40 per mission).

**Plans and tasks**

- Pass — A task has a status and an assignee. Claiming is atomic, so two people
  cannot take the same task. Only the assignee or a manager can complete or release it.
- Pass — Adopting a plan creates each task exactly once, inside a serialisable transaction.
- Gap — No history of who changed a task and when.

**Access**

- Pass — A private mission is visible to its creator only. A community mission
  is visible to current members; someone who leaves the community loses access,
  including the creator. Others get "not found", not "forbidden".
- Pass — Only the creator or a community admin or moderator can run AI steps
  and adopt outputs.

**Engineering**

- Pass — The schema ships as a migration, `20261114120000_mission_studio`.
- Pass — Tests exist: `scripts/check-missions.cjs` (real API and browser tests
  on a disposable PostgreSQL with a local model fixture) and
  `scripts/check-session.cjs`. Only the session tests were re-run for this review.
- Pass — Missions are in the workspace navigation, the command menu, the civic
  desk and the landing page.
- Gap — AI runs are synchronous and need up to 120 seconds. If the server worker
  is killed, the run is lost and shown as timed out. Check the hosting plan's
  function time limit before promising this works in production.
- Gap — `worklog.md` has no entry for this work.

**Next steps, in order**

1. **Set `SESSION_SECRET` and deploy to a staging database.** Run
   `npm run db:migrate:deploy`, then `scripts/check-missions.cjs`, then one real
   mission end to end with the real model. Nothing here has been proven against a
   live provider.
2. **Let people edit a draft form before publishing**, and build one by hand.
   Reuse `toolSchema` to validate the edited form. This is the largest gap
   against "people decide": today they can only accept or reject.
3. **Close, unpublish and delete.** Close a form to new responses, unpublish it,
   and delete a mission with everything in it. Add CSV export for managers.
4. **A code check for sensitive questions.** Reject or flag field labels that
   match a short list (name, phone, email, address, health, religion, politics,
   identity number) before a form can be published, and show the reason.
5. **Record the model and prompt version** on `MissionRun`.
6. **Decide who sees responses** (question 5) and add a per-form setting if the
   answer is "it depends". State retention on the form.
7. **Task history.** A small `MissionTaskEvent` table: task, actor, action, time.
8. **Fix the design items in 5.12**, starting with the 8px draft label.
9. **Matching.** Suggest which offers fit which tasks using a rule over form
   fields; a person confirms every match.
10. **Follow-through.** Link completed mission tasks to the accountability
    tracker (7.5), and let a community save an adopted plan and form as a template.

Done when: the gaps above are closed or explicitly accepted by the owner, and a
real mission has run end to end on staging.

### 7.1 Verifiable sortition (smallest build, strongest demo)

Today `src/app/api/sortition/[id]/select/route.ts` shuffles with `Math.random()`,
records no seed, and with more than one demographic dimension can select more
people than there are seats.

Build:

1. **Commit before the draw.** When recruitment closes, store and publish: a
   SHA-256 hash of the sorted candidate list (ids and strata only), the quota
   targets, the algorithm version, and the future round number of a public
   randomness beacon (drand) that will supply the seed. Read drand's current
   documentation for the chain and endpoint; do not hard-code from memory.
2. **Deterministic draw.** A pure function
   `draw(candidates, targets, seats, seed) → { selected, alternates }` in
   `src/lib/sortition.ts`. Random numbers come from the seed through SHA-256 in
   counter mode with rejection sampling. No `Math.random()`.
3. **Correct quotas.** Treat all dimensions jointly. Never exceed `seats`. If
   the targets cannot be met from the pool, fail with a clear message naming the
   stratum that is short, instead of silently filling from the general pool.
4. **Public audit page** at `/sortition/[id]/audit` (no login): inputs, seed,
   algorithm version, result, and a "verify in your browser" button that re-runs
   `draw` client-side and compares.
5. **Later upgrade:** replace the greedy quota draw with a maximally fair
   selection method (Flanigan et al., *Nature* 2021). It needs an integer
   programming solver, so plan it as a separate service; check the licences of
   existing open implementations before reusing code.

Data: add to `SortitionPool` — `candidateListHash`, `beaconRound`, `seed`,
`algorithmVersion`, `drawLog` (JSON). Mark the old `selectedMembers` results as
"legacy, not verifiable".

Done when: tests show the same inputs always give the same panel, quotas hold
for multi-dimension targets, seats are never exceeded, and the audit page
reproduces a stored draw.

### 7.2 Consensus mapping for deliberation

Today the AI debate route decides when agents speak using message counts and a
21-word positive/negative list (`analyzeSentiment`). Replace the sentiment list;
it is not a basis for moderation.

Build:

1. **Statements and reactions.** In a process's deliberation phase, people
   submit short statements and react to others with agree / disagree / pass.
   Models: `Statement` (processId, authorId, text, status) and
   `StatementReaction` (statementId, userId, value), one per user per statement.
2. **Opinion groups by arithmetic, not by a model.** Build the participant ×
   statement matrix, reduce it with principal component analysis, cluster with
   k-means (choose k from 2 to 5 by silhouette score). Put this in
   `src/lib/consensus.ts` as pure functions with tests.
3. **Bridging statements.** For each statement compute, per group, the smoothed
   agreement rate `(agree + 1) / (votes + 2)`; the consensus score is the product
   across groups. Rank by it. This rewards statements that every group accepts,
   not the loudest majority.
4. **Opinion map view.** Show the groups, the top bridging statements, and the
   statements that divide. Use the tint pairs for groups, never red versus green.
5. **AI summary with citations.** A model may write a short summary of each
   group's view. Every sentence must cite statement ids; drop any sentence whose
   citations are missing or do not exist. Label it "AI-written summary" using the
   sun callout style.
6. **Moderation.** Statements pass a human-reviewable queue. A model may flag,
   never remove.

Done when: clustering and scoring are deterministic and tested on fixtures, the
summary validator rejects uncited sentences, and the view is usable by keyboard
and at 390px.

### 7.3 Verified, private identity

`BindingProposalSignature.verified` exists but nothing sets it. A binding
threshold is meaningless without knowing each signer is a real, eligible, unique person.

Build:

1. An `IdentityProvider` interface in `src/lib/identity/` with one method that
   returns **attributes, not identity**: `{ uniqueWithinScope, residentOf, overAge }`.
2. A first adapter for whatever a pilot customer can supply (email domain,
   resident register upload, invitation codes posted to households).
3. A second adapter for the EU Digital Identity Wallet using selective
   disclosure. Member states are due to offer wallets by the end of 2026; check
   the current state of the specifications and national roll-outs before
   building, since this area changes quickly.
4. Store a per-scope pseudonym (a keyed hash of the provider's subject id and the
   scope), not the identity document. Store what was proven and when.
5. Each process, initiative and binding proposal declares its eligibility rule,
   shown beside the action (section 5.9).

Done when: one person cannot sign twice under two accounts in a verified scope,
and no identity document is stored.

### 7.4 Real voting methods and a public record

Build, as separate pull requests:

1. **Tally library** `src/lib/tally/`: pure, tested functions for yes/no,
   single choice, instant-runoff ranked choice, quadratic voting (cost = votes²
   from a fixed credit budget), and the Method of Equal Shares for budgets (see
   equalshares.net for the specification). Publish each method's rules on a
   public methods page and show the method name in the decision room.
2. **Ballot storage** that fits the method: add `ranking` and `allocation` JSON
   columns instead of overloading `Vote.option`.
3. **Tamper-evident ballot log.** Each ballot record stores
   `hash = SHA-256(previousHash + canonical ballot)`. The voter gets a receipt
   code (shown in IBM Plex Mono). A public page lists the chain so a voter can
   find their receipt and anyone can recompute the tally. Publish the chain head
   at close.
4. **Real anonymity** where promised: separate the "has voted" record (linked to
   the person) from the ballot (linked only to a receipt).

Be precise in the interface and in marketing: this gives tamper evidence and lets
a voter check their ballot was included. It is **not** end-to-end verifiable
voting, and it does not protect against coercion. Do not claim either.

Done when: every tally function has tests including ties and exhausted ballots,
and recomputing from the public log reproduces the stored result.

### 7.5 Commitment tracker

`ImplementationMilestone` and the accountability page exist. Extend them:

1. A response clock on every item that reaches a threshold: `responseDeadline`
   is shown as a countdown, and "overdue" is a visible public state.
2. Milestones marked complete require at least one piece of evidence.
3. When a status changes, every signer, voter and follower is notified ("You
   said, we did") through the existing email and push services.
4. Move "following" from browser storage (`WorkspaceContext`) to a `Follow`
   table so it works across devices and can drive notifications.
5. Open data: a documented public read API and CSV/JSON export for processes,
   results and milestones.

### 7.6 Inclusion

1. **Languages.** `next-intl` is installed and unused, and `<html lang="en">` is
   fixed. Move interface strings into message files, starting with landing,
   account entry, the civic desk and the decision room. Start with the languages
   of the first pilot customers.
2. **Content translation.** Machine-translate user content on request, always
   labelled as machine translation, with the original one tap away.
3. **Plain-language summaries** of proposals and legislation, cited to the
   paragraphs they summarise, labelled as AI-written.
4. **Other channels.** Voice input for statements, and SMS or WhatsApp for
   notifications and simple surveys.
5. Clear the type-size and contrast debt in 5.11.

### 7.7 Offer for organisations (after 7.1–7.4)

The same engine, sold separately to organisations: stakeholder consultation for
sustainability reporting, employee participatory budgeting, community
consultation for developers and utilities, and member governance for co-ops and
housing associations. Requirements: organisation-scoped eligibility (7.3),
private processes, exports, and an audit pack per decision. Do not build this
before the integrity work; it is what they would be buying.

### 7.8 AI register

Publish a public page listing every place a model is used, the provider and
model, what it may and may not do, and how to contest an output. AI that could
influence voting behaviour is close to territory the EU AI Act treats as high
risk; get a proper classification before marketing AI features to public bodies.

---

## 8. Definition of done for any change

- [ ] Works at 1440, 1024, 768 and 390px, by mouse and by keyboard.
- [ ] Uses only the tokens and tint pairs in section 5; contrast checked.
- [ ] Authorisation and input validation are in the route handler.
- [ ] New logic has tests, and `node --test scripts/check-session.cjs scripts/check-voting.cjs` still passes.
- [ ] Mission changes: `scripts/check-missions.cjs` passes, or the PR says it was not run.
- [ ] `npm run lint` passes and `npx tsc --noEmit` shows no new diagnostics.
- [ ] `npm run build:next` passes.
- [ ] Schema changes ship as a migration.
- [ ] No invented data, and nothing claims more than the code does.
- [ ] `DESIGN.md`, `worklog.md` and the roadmap status below are updated.
- [ ] The PR says what was verified, how, and what could not be verified.

Commit messages: `type(scope): description`, for example
`fix(auth): replace unsigned session cookie with stored sessions`.

## 9. Do not

- Use `Math.random()` for anything that selects, orders or samples people.
- Let a model decide an outcome, a moderation removal or an eligibility check.
- Colour one voting option differently from another.
- Award points, levels or reputation for voting or signing.
- Call anything "binding", "verified", "anonymous" or "end-to-end verifiable"
  unless the code enforces exactly that.
- Reintroduce the dark space theme, gradients on text, glow effects or glass cards.
- Add an HTTP route that seeds, resets or migrates data.
- Let a form take responses, or tasks reach the action board, before a manager adopts them.
- Remove the "AI draft" label or the references from an output that has not been adopted.
- Collect a response without first telling the person who will see it.
- Render a form field type that is not on the validated list.
- Leave a commit unpushed at the end of a session.

## 10. Roadmap status

Update this table in the same pull request as the work.

| Item | Status |
|---|---|
| 6.1 Signed sessions | Done in `cf56cb8`. Follow-ups open: set `SESSION_SECRET`, add revocation |
| 6.2 Seed routes and official codes | Not started |
| 6.3 Vote and email exposure | Not started |
| 6.4 Tally integrity | Not started |
| 6.5 Hardening | Not started |
| 7.0 Mission Studio | Built in `cf56cb8` and reviewed. Open gaps listed in 7.0; not yet run on staging |
| 7.1 Verifiable sortition | Not started |
| 7.2 Consensus mapping | Not started |
| 7.3 Verified identity | Not started |
| 7.4 Voting methods and public record | Not started |
| 7.5 Commitment tracker | Not started |
| 7.6 Inclusion | Not started |
| 7.7 Organisations offer | Not started |
| 7.8 AI register | Not started |

## 11. Questions for the owner

Ask before building the part they affect; do not guess.

1. Which city, organisation or country is the first pilot? It decides languages
   (7.6) and the identity adapter (7.3).
2. Has the application ever been deployed with the seed route or the hard-coded
   official codes reachable? If so, accounts and codes need rotating (6.2).
3. Should civic games, leaderboards and XP stay at all once XP is removed from
   voting (6.4)?
4. Which AI provider and region should production use? It affects data
   residency for any public-sector customer.
5. For mission forms: today every member with access to the mission sees every
   response with the author's name. Is that right for all forms, or should a
   form be able to limit answers to organisers? And how long are answers kept?
6. Does the hosting plan allow a request to run for 120 seconds? Mission AI
   steps need it (section 2).
7. May contributor names be sent to the AI provider with their contributions,
   or should they be removed first (7.0)?
