# Block Party

Two original browser minigames at `/dashboard/games/block-party`, featured on the games shelf. Three.js renders the toy neighbourhood, characters, ball, rings and obstacles. Assets are procedural; no artwork, characters or levels from commercial games are included.

- **Rooftop Rally — inclusion through shared infrastructure:** golden rings are building materials. Spend two at a marked middle-row gap (F / right Ctrl / touch Build) to open a public bridge. Three neighbours, including a person with a wheeled cart, stop at missing crossings. The round is won only when all three cross the continuous route; collecting every ring or jumping across alone does not win. Shared bridges also support the players.
- **Bumper Buddies — equity and stewardship:** eight resource balls must meet four different project needs: a cool square (3), library (2), step-free stop (2), and play street (1). All goals are available, so players choose where to steer. Completed projects bounce surplus deliveries back without consuming budget or awarding points. Equal deliveries to each site cannot satisfy the unequal needs. The team wins only when all projects are ready. In-game needs are illustrative, not real public-budget estimates.
- The HUD shows the shared budget, waiting neighbours and project needs. Results report the infrastructure built or unmet needs from the actual run, followed by a brief explanation of the civic principle.
- Solo keyboard/touch and two players on one keyboard. The second player uses arrows, Enter and right Shift; the first uses WASD, Space and E. There are no online rooms or remote players.
- Each round lasts 75 seconds, or players can disable the clock. Pause stops simulation; switching tabs or losing focus automatically pauses. Reduced-motion mode removes decorative movement and particles; moving obstacles remain part of gameplay. Sound is optional and starts only after user interaction.
- Results stay in memory and reset on replay or reload. They do not award account XP, affect votes, or publish participant data. This is a playable first version; enjoyment, difficulty and long-term social impact still need playtesting with neighbours.

## Checks

With Node 24 (native TypeScript stripping):

```sh
node --test scripts/check-block-party.mjs
npx tsc --noEmit
```

The browser check runs against a local development server, with mocked account and notification API responses. It does not test authentication or production services. Install Playwright in a temporary tools directory or supply an existing installation:

```sh
npm run dev
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROMIUM_PATH=/usr/bin/chromium node scripts/check-block-party-ui.cjs
```

Screenshots are saved in the ignored `artifacts/block-party/` directory. A WebGL-capable browser is required. The simulation tests cover jumping, fall recovery, normalization, pickup deduplication, cooperative bonuses, ball contact, goal relocation, round limits and dash cooldown.
