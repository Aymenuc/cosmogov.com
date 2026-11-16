import GamePlayer from "@/components/games/GamePlayer";
import { GAMES } from "@/lib/games/catalogue";

export default function Page() {
  const g = GAMES["chrono-autopsy"];
  return (
    <GamePlayer
      meta={{ slug: g.slug, name: g.name, tagline: g.tagline, how: g.how, skill: g.skill, tint: "mint", rounds: g.rounds, learn: g.learn, apply: g.apply }}
    />
  );
}
