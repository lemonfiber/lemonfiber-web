/**
 * What the checks screen has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/reports`.
 */
import { offer, undone } from "../api/reports";
import type { Mender } from "../lib/mending";
import type { Work } from "../lib/work";

export { agreement, carried, offer, undone } from "../api/reports";

/** The name lemonfiber gave the asking. */
const job = "5c63e1ab7d0e9f24";

/** A record of asking what can be put right, with the offer it came back with. */
export const offered: Work = {
  id: "11",
  doing: "repair",
  scoped: false,
  given: {},
  at: "done",
  job,
  came: { kind: "repair", report: offer },
};

/** A record of putting the last repair back, and what that came to. */
export const putBack: Work = {
  id: "12",
  doing: "undo",
  scoped: false,
  given: {},
  at: "done",
  job,
  came: { kind: "undo", report: undone },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const mender: Mender = {
  work: [],
  asked: undefined,
  picked: [],
  busy: false,
  onask: nothing,
  onpick: nothing,
  onleave: nothing,
  ondrop: nothing,
};
