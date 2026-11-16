# One More Block

A turn-taking neighbourhood puzzle at `/dashboard/games/one-more-block`, featured on the games shelf. The tactile board uses CSS illustrations and depth effects. Slide matching resource tiles together, then choose when to contribute them. Contributions clear space for the next move. Win by meeting all three fictional community wishes within 36 turns: shared meals (8), safe play (4), and step-free access (4). A high merge score alone cannot win.

The civic mechanic is the tension between accumulating a larger tile and contributing to a shared need. Completed wishes cannot consume extra resources. Any surplus on a contributed tile stays on the board. Access is a required part of the win, not an optional bonus. Results explain outstanding needs or the collective outcome from the actual round. These are illustrative puzzle quantities, not real public-budget estimates or evidence of educational impact.

Two neighbours alternate on the same device; solo mode uses the same rules. The board supports keyboard arrows while focused, touch swipes, explicit slide buttons and one shared undo. The default starting seed uses the UTC date. A challenge link preserves the seed so another device starts with the same board; it does not synchronise players. Progress is held in memory and resets on reload. No accounts, real resources or scores are modified.

## Verification

Use Node 24 for native TypeScript support:

```sh
node --test scripts/check-one-more-block.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROMIUM_PATH=/usr/bin/chromium node scripts/check-one-more-block-ui.cjs
```

The browser script expects a local dev server on port 3000 (override `PARTY_TEST_URL`) and mocks account APIs. It completes a winning round through the UI, checks keyboard movement, single-use undo, contribution effects, civic result text, the shared challenge link, mobile overflow and an actual touch swipe. Screenshots go to the ignored `artifacts/one-more-block/` directory.

Simulation tests cover seeded reproducibility, single-merge-per-slide rules, resource types, conservation, blocked moves, contribution turns, surplus retention, inclusion as a win condition, final-turn wins and move limits. During development, a bounded search found winning 19-turn paths for seeds 1, 20261116, 20261117 and 999; this does not prove every seed solvable or replace human playtesting.
