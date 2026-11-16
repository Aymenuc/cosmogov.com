import GamesHome from "@/components/games/GamesHome";
import { GAMES, GAME_ORDER } from "@/lib/games/catalogue";

export default function GamesPage() {
  const games = GAME_ORDER.map((slug) => {
    const g = GAMES[slug];
    return { slug, name: g.name, tagline: g.tagline, skill: g.skill, rounds: g.rounds };
  });
  return <GamesHome games={games} />;
}
