/**
 * What the backups and support panels have asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/archived`.
 */
import { archive, backed, described, listing } from "../api/archived";
import type { Keeper } from "../lib/upkeep";
import type { Work } from "../lib/work";

export {
  archive,
  backed,
  described,
  kept,
  listed,
  listing,
  restored,
  written,
} from "../api/archived";

/** The name lemonfiber gave the asking. */
const job = "7e0d5c63e1ab9f24";

/** A record of taking a backup, and where it went. */
export const tookBackup: Work = {
  id: "21",
  doing: "backup",
  scoped: false,
  given: {},
  at: "done",
  job,
  came: { kind: "backup", report: backed },
};

/** A record of asking what putting an archive back would do. */
export const readListing: Work = {
  id: "22",
  doing: "restore",
  scoped: false,
  given: { archive },
  at: "done",
  job: undefined,
  came: { kind: "restore", report: listing },
};

/** A record of asking what a support bundle would hold. */
export const readBundle: Work = {
  id: "23",
  doing: "support",
  scoped: false,
  given: { write: false, logs: 500, filenames: true },
  at: "done",
  job,
  came: { kind: "bundle", report: described },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked yet, and nothing pressed answered. */
export const keeper: Keeper = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
