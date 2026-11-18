import { workshopRoutes } from "@/lib/games/workshop-server";
import { actions, board, freshGame, play } from "@/lib/games/derby-server";
export const { GET, POST } = workshopRoutes({
  id: "derby",
  actions,
  board,
  freshGame,
  play,
  hostMoves: ["advance", "clock", "finish"],
});
