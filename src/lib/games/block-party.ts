/** Local party simulation. No account rewards or civic outcomes are awarded. */
export type PartyGame = "rally" | "bumpers";
export type PartyMode = "solo" | "duo";
export type Input = { x: number; z: number; jump: boolean; dash: boolean };
export type Actor = {
  x: number;
  z: number;
  y: number;
  vy: number;
  dx: number;
  dz: number;
  dash: number;
  cooldown: number;
  checkpoint: { x: number; z: number };
  falls: number;
  jumpHeld: boolean;
};
export type Ring = { x: number; z: number; taken: boolean };
export const EMPTY_INPUT: Input = { x: 0, z: 0, jump: false, dash: false };
export const TILES = [-8, -4, 0, 4, 8].flatMap((x) =>
  [-4, 0, 4].map((z) => ({ x, z })),
);
export const GOALS = [
  { x: -6, z: -4.3 },
  { x: 6, z: 4.3 },
  { x: 6, z: -4.3 },
  { x: -6, z: 4.3 },
];
export interface PartyState {
  game: PartyGame;
  mode: PartyMode;
  practice: boolean;
  remaining: number;
  elapsed: number;
  status: "playing" | "finished";
  players: Actor[];
  rings: Ring[];
  ball: {
    x: number;
    z: number;
    vx: number;
    vz: number;
    lastTouch: number;
    previousTouch: number;
  };
  goal: number;
  score: number;
  deliveries: number;
  assists: number;
  lastCollector: number;
  lastCollection: number;
  message: string;
  event: number;
  seed: number;
}
export function createParty(
  game: PartyGame,
  mode: PartyMode,
  practice = false,
  seed = 0,
): PartyState {
  return {
    game,
    mode,
    practice,
    remaining: 75,
    elapsed: 0,
    status: "playing",
    players: Array.from({ length: mode === "duo" ? 2 : 1 }, (_, i) => ({
      x: game === "rally" ? (i ? 8 : -8) : i ? 2 : -2,
      z: 4,
      y: 0,
      vy: 0,
      dx: 0,
      dz: -1,
      dash: 0,
      cooldown: 0,
      checkpoint: { x: i ? 8 : -8, z: 4 },
      falls: 0,
      jumpHeld: false,
    })),
    rings: TILES.filter((t) => !(t.z === 4 && Math.abs(t.x) === 8)).map(
      (t) => ({ ...t, taken: false }),
    ),
    ball: { x: 0, z: 1, vx: 0, vz: 0, lastTouch: -1, previousTouch: -1 },
    goal: seed % GOALS.length,
    score: 0,
    deliveries: 0,
    assists: 0,
    lastCollector: -1,
    lastCollection: -10,
    message:
      game === "rally"
        ? "Jump the gaps. Grab every golden ring!"
        : "Bump the ball into the glowing goal!",
    event: 0,
    seed,
  };
}
export function say(s: PartyState, message: string) {
  s.message = message;
  s.event++;
}
export function tileAt(x: number, z: number) {
  return TILES.find(
    (t) => Math.abs(t.x - x) < 1.68 && Math.abs(t.z - z) < 1.68,
  );
}
export function sweepPoint(
  x: number,
  z: number,
  angle: number,
  length: number,
) {
  const dx = Math.cos(angle),
    dz = Math.sin(angle);
  const dot = Math.max(-length, Math.min(length, x * dx + z * dz));
  return { x: dot * dx, z: dot * dz };
}
export function stepParty(s: PartyState, inputs: Input[], dt: number) {
  if (s.status !== "playing" || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 1 / 30);
  s.elapsed += dt;
  if (!s.practice) {
    s.remaining = Math.max(0, s.remaining - dt);
    if (!s.remaining) {
      s.status = "finished";
      say(s, "Round complete!");
      return;
    }
  }
  const angle = s.elapsed * (s.game === "rally" ? 1.4 : 0.85) + s.seed;
  s.players.forEach((p, i) => {
    const input = inputs[i] || EMPTY_INPUT;
    const norm = Math.max(1, Math.hypot(input.x, input.z));
    const mx = input.x / norm,
      mz = input.z / norm;
    if (mx || mz) {
      p.dx = mx;
      p.dz = mz;
    }
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.dash = Math.max(0, p.dash - dt);
    if (input.dash && p.cooldown === 0) {
      p.dash = 0.2;
      p.cooldown = 1.6;
    }
    const ground = s.game === "bumpers" || tileAt(p.x, p.z);
    if (input.jump && !p.jumpHeld && p.y === 0 && ground) p.vy = 8;
    p.jumpHeld = input.jump;
    const speed = p.dash > 0 ? 11 : 5;
    p.x += (p.dash > 0 ? p.dx : mx) * speed * dt;
    p.z += (p.dash > 0 ? p.dz : mz) * speed * dt;
    p.vy -= 20 * dt;
    p.y += p.vy * dt;
    const tile = tileAt(p.x, p.z);
    if (
      p.y <= 0 &&
      p.y > -0.35 &&
      p.vy <= 0 &&
      (s.game === "bumpers" || tile)
    ) {
      p.y = 0;
      p.vy = 0;
      if (tile) p.checkpoint = { ...tile };
    }
    if (s.game === "bumpers") {
      p.x = Math.max(-9, Math.min(9, p.x));
      p.z = Math.max(-5.8, Math.min(5.8, p.z));
    }
    if (p.y < -4) {
      p.x = p.checkpoint.x;
      p.z = p.checkpoint.z;
      p.y = 2;
      p.vy = 0;
      p.falls++;
      say(s, "Boing! Back at your last rooftop.");
    }
    const centres = s.game === "rally" ? [-4, 4] : [0];
    for (const cx of centres) {
      const near = sweepPoint(
        p.x - cx,
        p.z,
        angle,
        s.game === "rally" ? 1.8 : 3.8,
      );
      const distance = Math.hypot(p.x - cx - near.x, p.z - near.z);
      if (distance < 0.58 && p.y < 0.65 && p.y >= 0) {
        p.x += -Math.sin(angle) * 9 * dt;
        p.z += Math.cos(angle) * 9 * dt;
      }
    }
    if (s.game === "rally" && p.y >= 0 && p.y < 2.6) {
      s.rings.forEach((r) => {
        if (!r.taken && Math.hypot(r.x - p.x, r.z - p.z) < 0.85) {
          r.taken = true;
          s.deliveries++;
          s.score += 100;
          const combo =
            s.lastCollector >= 0 &&
            s.lastCollector !== i &&
            s.elapsed - s.lastCollection < 5;
          if (combo) {
            s.score += 50;
            s.assists++;
          }
          s.lastCollector = i;
          s.lastCollection = s.elapsed;
          say(s, combo ? "Neighbour combo! +150" : "Ring collected! +100");
        }
      });
    }
  });
  if (s.game === "rally" && s.rings.every((r) => r.taken)) {
    s.score += s.practice ? 0 : Math.ceil(s.remaining) * 10;
    s.status = "finished";
    say(s, "Every rooftop conquered!");
  }
  if (s.game === "bumpers") {
    const b = s.ball;
    s.players.forEach((p, i) => {
      const dx = b.x - p.x,
        dz = b.z - p.z,
        dist = Math.hypot(dx, dz);
      if (dist < 1.2 && p.y < 1.3) {
        const nx = dist > 0.001 ? dx / dist : p.dx,
          nz = dist > 0.001 ? dz / dist : p.dz;
        b.x = p.x + nx * 1.2;
        b.z = p.z + nz * 1.2;
        const force = p.dash > 0 ? 14 : 7;
        b.vx = nx * force;
        b.vz = nz * force;
        if (b.lastTouch !== i) {
          b.previousTouch = b.lastTouch;
          b.lastTouch = i;
        }
      }
    });
    const near = sweepPoint(b.x, b.z, angle, 3.8);
    if (Math.hypot(b.x - near.x, b.z - near.z) < 0.85) {
      b.vx += -Math.sin(angle) * 30 * dt;
      b.vz += Math.cos(angle) * 30 * dt;
    }
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.vx *= Math.exp(-0.7 * dt);
    b.vz *= Math.exp(-0.7 * dt);
    if (Math.abs(b.x) > 8.8) {
      b.x = Math.sign(b.x) * 8.8;
      b.vx *= -0.8;
    }
    if (Math.abs(b.z) > 5.5) {
      b.z = Math.sign(b.z) * 5.5;
      b.vz *= -0.8;
    }
    const goal = GOALS[s.goal];
    if (Math.hypot(b.x - goal.x, b.z - goal.z) < 1.35) {
      const assist = b.previousTouch >= 0;
      s.score += assist ? 250 : 150;
      s.deliveries++;
      if (assist) s.assists++;
      say(
        s,
        assist ? "Team goal! Both neighbours helped. +250" : "GOOOAL! +150",
      );
      s.goal = (s.goal + 1) % GOALS.length;
      Object.assign(b, {
        x: 0,
        z: 1,
        vx: 0,
        vz: 0,
        lastTouch: -1,
        previousTouch: -1,
      });
      if (s.deliveries >= 6) {
        s.status = "finished";
        say(s, "Six goals. One brilliant team!");
      }
    }
  }
}
