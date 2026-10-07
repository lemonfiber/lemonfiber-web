/**
 * What the room panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/spaces`.
 */
import { reclaimedRoom, roomy } from "../api/spaces";
import type { Reclaimer } from "../lib/reclaiming";
import type { Work } from "../lib/work";

export { busy, reclaimedRoom, roomy } from "../api/spaces";

/** A record of the room that costs nothing taken back. */
export const reclaimedRecord: Work = {
  id: "95",
  doing: "space",
  scoped: false,
  given: { offer: roomy.agreement },
  at: "done",
  job: undefined,
  came: { kind: "space", report: reclaimedRoom },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked about taking back room yet. */
export const reclaimer: Reclaimer = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
