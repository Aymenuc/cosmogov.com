# Block Party

Two original browser minigames at `/dashboard/games/block-party`, featured on the games shelf. Three.js renders the toy neighbourhood, characters, ball, rings and obstacles. Assets are procedural; no artwork, characters or levels from commercial games are included.

- **Rooftop Rally:** collect 13 rings across rooftop islands. Jump gaps and rotating sweepers, dash, and respawn at the last landed rooftop. Alternating pickups by different players within five seconds earns a team bonus.
- **Bumper Buddies:** knock a ball into six successive goal locations. Rebounding walls and a rotating sweeper change its trajectory. Goals earn a bonus when both players touched the ball.
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
