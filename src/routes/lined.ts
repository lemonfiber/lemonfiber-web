/**
 * What the line and updates panels have asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/lines`.
 */
import { declared, moved, plan } from "../api/lines";
import type { Sharer } from "../lib/sharing";
import type { Updater } from "../lib/updating";
import type { Work } from "../lib/work";

export { declared, means, moved, plan, shared } from "../api/lines";

/** A record of limits declared and written to the clients. */
export const declaredRecord: Work = {
  id: "71",
  doing: "bandwidth",
  scoped: false,
  given: { down: "50%" },
  at: "done",
  job: undefined,
  came: { kind: "bandwidth", report: declared },
};

/** A record of what updating would change, read and not yet agreed to. */
export const planRecord: Work = {
  id: "72",
  doing: "update",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "update", report: plan },
};

/** A record of the update taken. */
export const movedRecord: Work = {
  ...planRecord,
  id: "73",
  given: { confirm: true, wait: false },
  came: { kind: "update", report: moved },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked of the line yet. */
export const sharer: Sharer = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};

/** Nothing asked about updating yet. */
export const updater: Updater = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
