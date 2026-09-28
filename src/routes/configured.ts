/**
 * What the settings panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/configs`.
 */
import { madeAtOnce, staged } from "../api/configs";
import type { Configurer } from "../lib/configuring";
import type { Work } from "../lib/work";

export { applied, everySetting, madeAtOnce, staged } from "../api/configs";

/** A record of a change staged for a yes, with its review. */
export const stagedChange: Work = {
  id: "41",
  doing: "config-set",
  scoped: false,
  given: { key: "data_location", value: "/mnt/media" },
  at: "done",
  job: undefined,
  came: { kind: "config", report: staged },
};

/** A record of a change made at once. */
export const changedAtOnce: Work = {
  id: "42",
  doing: "config-set",
  scoped: false,
  given: { key: "port_forwarding", value: "off" },
  at: "done",
  job: undefined,
  came: { kind: "config", report: madeAtOnce },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const configurer: Configurer = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
