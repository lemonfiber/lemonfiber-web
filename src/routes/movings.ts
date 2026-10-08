/**
 * What the survey panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/moves`.
 */
import { adopted, wouldAdopt, wouldReplace } from "../api/moves";
import type { Mover } from "../lib/moving";
import type { Work } from "../lib/work";

/** A record of what adopting the media project would come to. */
export const adoptOffer: Work = {
  id: "101",
  doing: "migrate-adopt",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "adoption", report: wouldAdopt },
};

/** A record of the media project adopted. */
export const adoptMade: Work = {
  ...adoptOffer,
  id: "102",
  given: { confirm: true },
  came: { kind: "adoption", report: adopted },
};

/** A record of what replacing the media project would stop. */
export const replaceOffer: Work = {
  id: "103",
  doing: "migrate-replace",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "replacement", report: wouldReplace },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked about what is already here yet. */
export const mover: Mover = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
