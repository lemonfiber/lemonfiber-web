/**
 * What the wiring panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/substitutions`.
 */
import { filled, wouldFill } from "../api/substitutions";
import type { Filler } from "../lib/filling";
import type { Work } from "../lib/work";

export { filled, wouldFill, wouldLeave } from "../api/substitutions";

/** A record of what choosing Jellyseerr for requests would come to. */
export const fillOffer: Work = {
  id: "97",
  doing: "wiring-fill",
  scoped: false,
  given: { capability: "requests", service: "jellyseerr", dry_run: true },
  at: "done",
  job: undefined,
  came: { kind: "substitution", report: wouldFill },
};

/** A record of that choice, written. */
export const fillMade: Work = {
  ...fillOffer,
  id: "98",
  given: {
    capability: "requests",
    service: "jellyseerr",
    offer: wouldFill.agreement,
  },
  came: { kind: "substitution", report: filled },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked about what fills a capability yet. */
export const filler: Filler = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
