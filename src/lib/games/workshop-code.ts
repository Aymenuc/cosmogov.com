import { randomInt } from "node:crypto";
import { z } from "zod";
export const roomLife = 7 * 86400;
export const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{8}$/);
export function roomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => letters[randomInt(letters.length)],
  ).join("");
}
