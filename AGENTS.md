# Cosmogov — instructions for the next agent

Read this file before changing anything. It records what the product is, how the
redesign is built, the exact design system, the defects that must be fixed first,
and the roadmap in build order.

Everything here was checked against the code on `redesign/civic-experience` at
commit `cbb9b8f` (14 Nov 2026) by reading it. Nothing was run against a live
database. Where a claim was not verified, it says so.

## 0. Start here: the missions commit

The newest work is **not described from code in this file**. The owner reports
that Codex committed it as `cf56cb8` on `redesign/civic-experience`, one commit
after `cbb9b8f`. When this file was last updated, GitHub still ended at `cbb9b8f`
and had no object `cf56cb8`, so the commit existed only in Codex's workspace.

What the owner says it contains (reported, not verified):

- A **mission** has a plan and tasks.
- **AI can turn a mission into a working community form**, for example
  collecting repair skills or equipment offers. Responses are saved alongside the
  mission's plan and tasks.
- **AI drafts show their references and their unanswered questions.**
- **People choose** which plans and tools become part of the mission.
- The visual direction stays warm and colourful (section 5 applies unchanged).

Do this before anything else:

1. Run `git fetch origin redesign/civic-experience` and `git cat-file -t cf56cb8`.
   - If you are the agent that holds `cf56cb8` locally and it is not on GitHub,
     push it: `git push origin redesign/civic-experience`. Nothing else can be
     reviewed, deployed or handed over until it is.
   - If the commit is on neither side, stop and ask the owner where it is.
2. Read the whole diff: `git show --stat cf56cb8`, then the files.
3. Review it against the checklist in section 7.0 and record what you find.
4. Update this file from what you read: the repository map (section 3), the
   defect list (section 6), section 7.0 and the status table (section 10). Replace
   every "reported, not verified" statement about missions with what the code does.

Until step 4 is done, treat every statement about missions in this file as the
owner's description of intent, not as a description of the code.

Related files: `DESIGN.md` (what the redesign changed and how it was verified),
`worklog.md` (history of earlier agents), `agent-ctx/` (notes per feature).

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
  something it wants done, AI drafts a plan, tasks and a form to gather what is
  needed, and people choose what to keep. This is where the three rules are
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
| Styling | Tailwind CSS 4 via `@import "tailwindcss"` plus three hand-written stylesheets (section 5.7) |
| Components | shadcn/ui (48 files in `src/components/ui`), Radix, `lucide-react` icons, `framer-motion` |
| Data | Prisma `^6.11.1` on Supabase Postgres. One migration: `prisma/migrations/20260425120000_init` |
| Auth | Hand-rolled cookie session in `src/lib/auth.ts`. `next-auth` is installed but **not used anywhere** |
| AI | `src/lib/ai-completions.ts`, OpenAI-shaped chat completions through the Z AI SDK or an NVIDIA-compatible endpoint |
| Maps | Leaflet and `react-leaflet` |
| Email / push | `src/lib/email.ts` (stub, SMTP or Resend), `src/lib/push-notifications.ts` (VAPID) |

```bash
npm ci
npm run dev               # port 3000, writes dev.log
npm run build:next        # next build + copy static into standalone
npm run build             # prisma migrate deploy, then build:next — needs DATABASE_URL
npm run lint
node --test scripts/check-voting.cjs   # 8 isolated tests of the vote route, no database
node scripts/check-redesign.cjs        # Playwright UI checks against a running server
```

Notes on these commands:

- `check-redesign.cjs` needs a server already running, Playwright and Chromium.
  `COSMOGOV_TEST_URL` and `COSMOGOV_TEST_ARTIFACTS` override its defaults. It
  intercepts API calls with fixtures, so it proves the interface, not the data layer.
- If Turbopack is blocked on the host, `npx next build --webpack` builds the same source.
- A passing build does **not** mean the code typechecks, because build errors are
  ignored. Run `npx tsc --noEmit` and compare against the baseline in `DESIGN.md`
  (16 pre-existing diagnostics). Do not add new ones.
- There is no unit-test runner configured. New logic in section 7 must arrive with
  tests. Follow the pattern in `scripts/check-voting.cjs` or add Vitest, and say
  which you chose in the PR.
- Environment variables are listed in `.env.example`. Never commit `.env`.

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
src/app/dashboard/proposals/          list, new, [id] = the decision room, [id]/edit
src/app/dashboard/participation/      processes, budget, initiatives, binding-proposals,
                                      legislation, surveys, assemblies, meetings,
                                      sortition, accountability
src/app/dashboard/{decisions,chat,assembly-hall,explore,pulse,analytics}
src/app/dashboard/{ai-agents,assistant,games,leaderboards,reputation}
src/app/dashboard/{gov-portal,admin,organizations,cosmic-map,search,settings}
src/app/api/**/route.ts               84 route handlers, one folder per resource
src/app/{globals,civic,community}.css the three style layers
src/components/                       Brand, SiteHeader, Footer, CommonsArt, ProposalCard,
                                      CommandMenu, StartProcessDialog, WorkspaceContext,
                                      AuthExperience, OfficialResponseBadge, ui/
src/lib/auth.ts                       session cookie (defective — section 6)
src/lib/civic.ts                      CivicProposal type, isOpen(), deadlineLabel(), voteLabel
src/lib/categories.ts                 the 10 topic categories and legacy mapping
src/lib/ai-completions.ts             the only place that calls a model
prisma/schema.prisma                  50 models
scripts/                              migrate-deploy, check-voting, check-redesign
```

Workspace navigation (defined in `src/app/dashboard/layout.tsx`):

- Main links: My civic desk, Explore participation, Proposals & voting, My
  communities, Community map, Accountability.
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
  SDK in a route or a component.
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

Three stylesheets load in this order in `src/app/layout.tsx`:

1. `globals.css` — Tailwind import, shadcn tokens, and **legacy utilities** from
   the dark theme (`.glass-card*`, `.glow-*`, `.text-gradient*`, starfield,
   map markers). The legacy class names are kept so old pages do not break; most
   are neutralised to flat cards.
2. `civic.css` (about 4,300 lines) — structure and layout for every redesigned
   surface. Breakpoints: 1200, 1150, 1000, 760, 550, 480px.
3. `community.css` (about 880 lines) — the colour and personality layer. It
   overrides `civic.css` and is where colour decisions live.

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

- Plain, warm, second person. "Have your say", "View decision", "Big ideas. Local magic."
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

### 5.12 AI drafts, mission plans and community forms

These rules apply the system above to the missions work. Check the existing
mission screens against them and bring them into line.

- **An AI draft always looks like a draft.** Use the AI callout pair: fill
  `#fff0c3`, border `#f2dd9d`, text `#745214`, with a visible "AI draft" label
  and a spark icon. Once a person accepts it, it becomes a normal white card and
  the label changes to who accepted it and when.
- **References and unanswered questions sit with the draft**, not behind a
  toggle. References are a short numbered list in the body font, each linking to
  its source. Unanswered questions use the peach pair (`#ffe7df` / `#a44231`) so
  they read as "needs a person", never as an error.
- **Choosing is an equal choice.** "Add to mission" and "Leave out" have the
  same size and weight; nothing is pre-selected, and declining a draft is one tap.
- **Forms are reading surfaces.** White card, 18px radius, inputs at 12px radius
  with a visible label above each field (never placeholder-only), help text in
  muted ink at 14px or larger, errors in `#bf4054` with an icon and a sentence
  that says how to fix it.
- **Say who will see the answers** directly above the submit button, in plain
  words, using the sky pair (`#e1f3ff` / `#226784`).
- **Task and plan status use the tint pairs**: to do lilac, in progress sun,
  done mint, blocked peach. Status is always text plus colour, never colour alone.
- Submit is the primary violet pill. One primary button per form.
- Forms must work at 390px with touch targets of at least 44px, and be fully
  usable by keyboard and screen reader.

---

## 6. Fix before anything else

These are defects in the current code. A civic platform that asks people to trust
its results cannot ship them. Do them in this order, each as its own pull request
with tests. The repository is public, so treat every value in source as known.

### 6.1 Sessions can be forged — critical

`src/lib/auth.ts`: the cookie is `base64("userId:timestamp:random")` with no
signature, and `getSession()` reads the user id out of it and trusts it. User ids
are returned by the API (`creator.id`, `voterId` in `GET /api/proposals`), so
anyone can build a cookie for any account, including an admin.

Steps:

1. Add a `Session` model: `id`, `userId`, `tokenHash` (unique), `expiresAt`,
   `createdAt`, `lastSeenAt`, optional `userAgent`. Write the migration.
2. On login and signup, generate 32 random bytes with `crypto.randomBytes`, set
   the hex value as the cookie, and store only its SHA-256 hash.
3. `getSession()` hashes the cookie, looks up the row, rejects if missing or
   expired, then loads the user.
4. Logout deletes the row. Add "sign out everywhere" (delete all rows for a user).
5. Keep `httpOnly`, `sameSite: 'lax'`, `secure` in production. Shorten lifetime
   to 14 days with sliding renewal.
6. Update `parseSession` in `src/middleware.ts` so it only checks that a cookie
   exists; real checks stay in handlers.
7. Old cookies stop working on deploy. Say so in the PR; that is intended.

Done when: a test proves a cookie built from a known user id is rejected, and a
real login still works for citizen, official and admin.

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

### 7.0 Missions and AI-drafted community forms (current work — verify, then harden)

This is the work in `cf56cb8` (section 0). The description below is the owner's;
the checklist is what the code must satisfy. Go through it against the real
diff, mark each line pass or fail in the pull request, and fix the failures
before building anything new on top.

**The form definition**

- [ ] The AI returns a form as data, and the server validates it with `zod`
      against a fixed list of field types (short text, long text, single choice,
      multiple choice, number, date, yes/no, contact). Anything else is rejected,
      not rendered.
- [ ] Limits are enforced in code: number of fields, label and option length,
      number of options.
- [ ] No AI-drafted form, plan or task is visible to the community until a
      person with rights on the mission accepts it. The acceptance is stored:
      who, when, and which draft version.
- [ ] An accepted form is versioned. Editing it after responses exist creates a
      new version; old responses stay tied to the version they answered.
- [ ] The AI does not add fields asking for health, religion, ethnicity,
      political opinion, identity documents or financial details. If a person
      adds one, the form shows a warning and requires a stated reason.

**The AI draft**

- [ ] All model calls go through `chatCompletionsCreate` in
      `src/lib/ai-completions.ts`.
- [ ] Mission text and form answers are treated as untrusted input: they are
      passed as content to analyse, never as instructions, and model output is
      never executed, never used as HTML, and never decides permissions.
- [ ] Every reference shown on a draft resolves to something real (a record in
      the database or a URL that was actually supplied). References that cannot
      be resolved are dropped by code before display, not left to the model.
- [ ] Unanswered questions are stored with the draft and shown, and a draft with
      open questions can still be declined or edited.
- [ ] A failed or empty model response produces a clear message and a way to
      build the form by hand. The feature works without AI.
- [ ] The draft records which model and prompt version produced it.

**Responses**

- [ ] The submit route checks the session and the mission's eligibility rule in
      the handler, validates the answers against the stored form version, and is
      rate limited.
- [ ] Reading responses is restricted in the handler to the mission's organisers.
      A participant can read, edit and delete their own response.
- [ ] The form states who will see the answers and how long they are kept
      before the person submits (section 5.12), and the stored response records
      that notice version.
- [ ] One response per person per form unless the form allows several, enforced
      by a database constraint and not only in the interface.
- [ ] Responses can be exported by organisers and deleted with the mission.
      Responses are never sent to the model unless the organiser asks for a
      summary, and then without names or contact details.
- [ ] No points, levels or reputation are awarded for responding.

**Plans and tasks**

- [ ] A task has an owner, a status and a history of who changed it.
- [ ] AI-suggested tasks are drafts until accepted, like forms.
- [ ] A mission page shows the plan, the tasks, the form and a count of
      responses, with each AI-drafted part labelled until accepted.

**Engineering**

- [ ] The schema change ships as a Prisma migration (section 4), not `db push`.
- [ ] New logic has tests: form validation, reference filtering, the response
      permission checks.
- [ ] Missions are reachable from the workspace navigation and the command menu.
- [ ] `DESIGN.md` and `worklog.md` describe the feature.

Why section 6 matters more now: form responses are personal data (names, skills,
what people own, how to reach them). With the forgeable session cookie (6.1),
anyone could submit as someone else or read an organiser's view. Fix 6.1 before
any real community uses a mission form.

Next steps once the checklist passes:

1. **Matching.** Turn responses into offers and needs, and suggest which offers
   fit which tasks. The suggestion is a rule over form fields first; a model may
   only help word the suggestion. A person confirms every match.
2. **Follow-through.** Link mission tasks to the accountability tracker (7.5) so
   a finished mission shows what was done with what people offered.
3. **Templates.** Let a community save an accepted form and plan as a template
   others can start from, with the original credited.
4. **Languages.** Mission forms are the first content to translate (7.6).

Done when: every checklist line is marked pass in a merged pull request, and
section 0 of this file has been rewritten from the code.

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
- [ ] New logic has tests, and `node --test scripts/check-voting.cjs` still passes.
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
- Show an AI-drafted form, plan or task to the community before a person accepts it.
- Collect a response without first telling the person who will see it.
- Render a form field type that is not on the validated list.
- Leave a commit unpushed at the end of a session.

## 10. Roadmap status

Update this table in the same pull request as the work.

| Item | Status |
|---|---|
| 6.1 Stored sessions | Not started |
| 6.2 Seed routes and official codes | Not started |
| 6.3 Vote and email exposure | Not started |
| 6.4 Tally integrity | Not started |
| 6.5 Hardening | Not started |
| 0 Missions commit `cf56cb8` on GitHub | Not pushed when last checked |
| 7.0 Missions and community forms | Built by Codex (reported); not reviewed against the checklist |
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
5. For mission forms: who may see responses (organisers only, or all mission
   members), and how long are they kept? The form must say so before submit (7.0).
6. Who may accept an AI draft into a mission: its creator only, or any organiser?
