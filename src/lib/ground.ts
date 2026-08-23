/**
 * The grounds a share of a whole is drawn on, and what a share is made of.
 *
 * A map of areas says one thing twice: how big each part is, and which part
 * matters most. The palette is the second telling, so it ramps by size rather
 * than naming a colour — a caller hands over a share and what it is, never a
 * background.
 */

/**
 * The biggest use takes lemon, the next takes fiber, the rest take the panel's
 * own ground, and the space nothing is using takes the page's.
 */
export type Ground = "biggest" | "next" | "other" | "free";

/**
 * Every ground there is, in the order the ramp runs.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyGround: readonly Ground[] = [
  "biggest",
  "next",
  "other",
  "free",
];

/**
 * One share of the whole.
 */
export interface Block {
  /** What is taking the space. */
  name: string;
  /** How much of it, as it should read. */
  value: string;
  /** Its share of the whole, from 0 to 1. */
  share: number;
  /** Which ground it takes. */
  ground: Ground;
}
