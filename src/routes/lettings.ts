/**
 * What the letting panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/spaces`.
 */
import { letGone, letOffer, shared } from "../api/spaces";
import type { Letter } from "../lib/seeding";
import type { Work } from "../lib/work";

export {
  kept,
  letGone,
  letOffer,
  reckoned,
  shared,
  stray,
} from "../api/spaces";

/** A record of what letting the shared download go would cost. */
export const offerRecord: Work = {
  id: "91",
  doing: "stop-seeding",
  scoped: false,
  given: { download: shared.name },
  at: "done",
  job: undefined,
  came: { kind: "stop-seeding", report: letOffer },
};

/** A record of the shared download let go. */
export const goneRecord: Work = {
  ...offerRecord,
  id: "92",
  given: { download: shared.name, offer: letOffer.agreement },
  came: { kind: "stop-seeding", report: letGone },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked about letting a download go yet. */
export const letter: Letter = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
