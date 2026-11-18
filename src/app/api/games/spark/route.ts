import { workshopRoutes } from "@/lib/games/workshop-server";
import { actions, board, freshGame, play } from "@/lib/games/spark-server";
export const { GET, POST } = workshopRoutes({
  id: "spark",
  actions,
  board,
  freshGame,
  play,
  hostMoves: ["advance", "clock", "finish"],
});
