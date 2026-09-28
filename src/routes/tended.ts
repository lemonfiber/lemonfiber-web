/**
 * What the household panels have asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/invitations` and `./house`.
 */
import { offered, wouldOffer } from "../api/invitations";
import { household } from "./house";
import type { Tender } from "../lib/tending";
import type { Work } from "../lib/work";

export { claimAt, offered, reissued, wouldOffer } from "../api/invitations";

/** A record of an offer read, with nothing made yet. */
export const readOffer: Work = {
  id: "51",
  doing: "invite",
  scoped: false,
  given: { name: "Sam", age_limit: 12, unrated: "block" },
  at: "done",
  job: undefined,
  came: { kind: "invitation", report: wouldOffer },
};

/** A record of the offer made, on the terms that were read. */
export const madeOffer: Work = {
  ...readOffer,
  id: "52",
  given: { ...readOffer.given, confirm: true },
  came: { kind: "invitation", report: offered },
};

/** A record of one request let through, and the household it left. */
export const letThrough: Work = {
  id: "53",
  doing: "household-approve",
  scoped: false,
  given: { request: 44 },
  at: "done",
  job: undefined,
  came: { kind: "household", report: household },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const tender: Tender = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
