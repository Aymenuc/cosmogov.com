"use client";

import { motion, useReducedMotion } from "framer-motion";
import ToolArt, { type ToolArtName } from "@/components/ToolArt";
import type { GameSlug } from "@/lib/games/catalogue";

// Each game borrows the drawing closest to what you do in it.
const ART: Record<GameSlug, ToolArtName> = {
  "strategic-command": "budget",
  "neural-consensus": "assemblies",
  "oracle-protocol": "analytics",
  "signal-detective": "accountability",
  "cognitive-warfare": "legislation",
  "chrono-autopsy": "meetings",
};

/** The game's drawing, floating gently in 3D. */
export default function GameArt({ slug }: { slug: GameSlug }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="gp-art"
      animate={reduce ? undefined : { rotateY: [-8, 8, -8], rotateX: [4, -4, 4], y: [0, -6, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <ToolArt name={ART[slug]} />
    </motion.div>
  );
}
