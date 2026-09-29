/**
 * Everything the console can ask lemonfiber for, one family to a panel, each
 * named as the endpoint names it.
 *
 * A record is of one of these. Which family a request belongs to decides which
 * panel draws its record, and what each takes and how it is asked about is in
 * the module each family names.
 */

/**
 * Something the console can ask for, named as the endpoint names it.
 */
export type Doing =
  "up" | "down" | "switch" | "restart" | "pull" | "watch" | "seed" | "adopt";

/**
 * Every action there is, in the order the controls show them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyDoing: readonly Doing[] = [
  "up",
  "down",
  "switch",
  "restart",
  "pull",
  "watch",
  "seed",
  "adopt",
];

/**
 * Something the checks screen can ask for, named as the endpoint names it.
 * What each takes and how it is asked about is in `./mending`.
 */
export type Mending = "repair" | "diagnose" | "accept" | "undo";

/**
 * Something the backups and support panels can ask for, named as the endpoint
 * names it. What each takes and how it is asked about is in `./upkeep`.
 */
export type Upkeep = "backup" | "restore" | "support";

/**
 * Something the quality panel can ask for, named as the endpoint names it.
 * What each takes and how it is asked about is in `./tuning`.
 */
export type Tuning = "quality-reapply" | "quality-upgrade";

/**
 * Something the settings panel can ask for, named as the endpoint names it.
 * What it takes and how it is asked about is in `./configuring`.
 */
export type Configuring = "config-set";

/**
 * Something the household panels can ask for, named as the endpoint names it.
 * What each takes and how it is asked about is in `./tending`.
 */
export type Tending =
  | "invite"
  | "reissue"
  | "household-allow"
  | "household-approve"
  | "household-decline";

/**
 * Something the pairing panel can ask for, named as the endpoint names it.
 * What it takes and how it is asked about is in `./pairing`.
 */
export type Pairing = "companion-pair";

/**
 * Something the line panel can ask for, named as the endpoint names it. What
 * it takes and how it is asked about is in `./sharing`.
 */
export type Sharing = "bandwidth";

/**
 * Something the updates panel can ask for, named as the endpoint names it.
 * What it takes and how it is asked about is in `./updating`.
 */
export type Updating = "update";

/**
 * Something the finding panels can ask for, named as the endpoint names it.
 * What each takes and how it is asked about is in `./finding`.
 */
export type Finding = "walkthrough" | "search";

/** Anything a record can be of. */
export type Requested =
  | Doing
  | Mending
  | Upkeep
  | Tuning
  | Configuring
  | Tending
  | Pairing
  | Sharing
  | Updating
  | Finding;
