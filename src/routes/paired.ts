/**
 * What the pairing panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The report inside the record is the one a suite stands in for a
 * running lemonfiber, in `../api/pairings`.
 */
import { material } from "../api/pairings";
import type { Pairer } from "../lib/pairing";
import type { Work } from "../lib/work";

export { material, zeroesForm } from "../api/pairings";

/** A record of pairing material made. */
export const made: Work = {
  id: "61",
  doing: "companion-pair",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "pairing", report: material },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const pairer: Pairer = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
