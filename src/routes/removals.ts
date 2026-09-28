/**
 * What the hosting and removal panels have asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/removals`.
 */
import { guardKept, removed, stored, surveyed } from "../api/removals";
import type { Hoster } from "../lib/hosting";
import type { Remover } from "../lib/removing";
import type { Work } from "../lib/work";

export {
  clock,
  clockTaken,
  forgotten,
  guard,
  guardKept,
  hosted,
  partlyRemoved,
  rehearsedRemoval,
  removed,
  settledSurvey,
  stored,
  surveyed,
  unhosted,
} from "../api/removals";

/** A record of the guard handed to the machine. */
export const keptRecord: Work = {
  id: "81",
  doing: "hosting-install",
  scoped: true,
  given: { kept: "watch", forms: ["media"] },
  at: "done",
  job: undefined,
  came: { kind: "hosting", report: guardKept },
};

/** A record of what lemonfiber keeps, listed and not yet forgotten. */
export const storedRecord: Work = {
  id: "82",
  doing: "forget",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "stored", report: stored },
};

/** A record of what removing the services would reach, not yet agreed to. */
export const surveyRecord: Work = {
  id: "83",
  doing: "uninstall",
  scoped: false,
  given: { tier: "services" },
  at: "done",
  job: undefined,
  came: { kind: "uninstall", report: surveyed },
};

/** A record of the services removed. */
export const removedRecord: Work = {
  ...surveyRecord,
  id: "84",
  given: {
    tier: "services",
    confirm: true,
    offer: surveyed.manifest.agreement,
    wait: false,
  },
  came: { kind: "uninstall", report: removed },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked about what this machine keeps running yet. */
export const hoster: Hoster = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};

/** Nothing asked about taking lemonfiber off yet. */
export const remover: Remover = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
