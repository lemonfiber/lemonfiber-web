/**
 * What the settings panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/values`.
 */
import {
  clearOffer,
  madeClear,
  madeSet,
  setOffer,
  wouldClear,
  wouldSet,
} from "../api/values";
import type { Valuer } from "../lib/valuing";
import type { Work } from "../lib/work";

/** A record of what moving the guard's tunnel would come to. */
export const setRead: Work = {
  id: "81",
  doing: "settings-set",
  scoped: false,
  given: { values: { "gluetun:vpn-type": "wireguard" }, dry_run: true },
  at: "done",
  job: undefined,
  came: { kind: "settings", report: wouldSet },
};

/** A record of that move made under its reading. */
export const setMade: Work = {
  ...setRead,
  id: "82",
  given: { values: { "gluetun:vpn-type": "wireguard" }, offer: setOffer },
  came: { kind: "settings", report: madeSet },
};

/** A record of what clearing the guard's countries would come to. */
export const clearRead: Work = {
  id: "83",
  doing: "settings-clear",
  scoped: false,
  given: { settings: ["gluetun:countries"], dry_run: true },
  at: "done",
  job: undefined,
  came: { kind: "settings", report: wouldClear },
};

/** A record of that clearing made under its reading. */
export const clearMade: Work = {
  ...clearRead,
  id: "84",
  given: { settings: ["gluetun:countries"], offer: clearOffer },
  came: { kind: "settings", report: madeClear },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked of any setting yet. */
export const valuer: Valuer = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
