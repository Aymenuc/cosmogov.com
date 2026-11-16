import GamePlayer from "@/components/games/GamePlayer";
import { GAMES } from "@/lib/games/catalogue";

export default function Page() {
  const g = GAMES["oracle-protocol"];
  return (
    <GamePlayer
      meta={{ slug: g.slug, name: g.name, tagline: g.tagline, how: g.how, skill: g.skill, tint: "sun", rounds: g.rounds, learn: g.learn, apply: g.apply }}
    />
  );
}
