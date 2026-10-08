/**
 * Every word a product explains, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Entry, Vocabulary } from "../lib/glossary";

/** A word with more to it, other services' words for it, and its own forms. */
export const seed: Entry = {
  word: "seed",
  short: "Keep sharing something after it finished, which costs upload.",
  deep: "Some trackers expect a share to keep going for a while after it finished.",
  also_called: ["seeding time"],
  forms: ["seeding", "seeded"],
};

/** A word that says all there is in one sentence. */
export const hardlink: Entry = {
  word: "hardlink",
  short: "One file in two places, taking its room once.",
  deep: null,
  also_called: [],
  forms: [],
};

/** Two words, in the order somebody meets them. */
export const vocabulary: Vocabulary = { words: [seed, hardlink] };
