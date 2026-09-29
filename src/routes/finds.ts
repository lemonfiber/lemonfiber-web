/**
 * What the finding panels have asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/found`.
 */
import { traced, walked } from "../api/found";
import type { Finder } from "../lib/finding";
import type { Work } from "../lib/work";
import type { Tracer } from "./tracing.svelte";

export { traced, unmatched, walked } from "../api/found";

/** A record of one thing walked all the way through. */
export const walkedRecord: Work = {
  id: "81",
  doing: "walkthrough",
  scoped: false,
  given: { item: "Big Buck Bunny" },
  at: "done",
  job: "8e1f",
  came: { kind: "walkthrough", report: walked },
};

/** A record of one item searched for, and where it was found to be. */
export const searchedRecord: Work = {
  id: "82",
  doing: "search",
  scoped: false,
  given: { term: "The Expanse", disruptive: true },
  at: "done",
  job: undefined,
  came: { kind: "trace", report: traced },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const finder: Finder = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};

/** Nothing looked up yet. */
export const tracer: Tracer = {
  reading: undefined,
  busy: false,
  onlook: nothing,
};
