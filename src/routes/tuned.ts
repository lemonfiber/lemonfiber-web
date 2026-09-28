/**
 * What the quality panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/qualities`.
 */
import { costed, reapplied } from "../api/qualities";
import type { Tuner } from "../lib/tuning";
import type { Work } from "../lib/work";

export {
  costed,
  fetched,
  inForce,
  reapplied,
  recyclarr,
} from "../api/qualities";

/** The name lemonfiber gave the asking. */
const job = "9e1ab7d0e5c63f24";

/** A record of asking what fetching the library again would cost. */
export const readCost: Work = {
  id: "31",
  doing: "quality-upgrade",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "upgrade", report: costed },
};

/** A record of putting the recorded preset back, and what it replaced. */
export const putQualityBack: Work = {
  id: "32",
  doing: "quality-reapply",
  scoped: false,
  given: {},
  at: "done",
  job,
  came: { kind: "quality", report: reapplied },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const tuner: Tuner = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
