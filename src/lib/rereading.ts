/**
 * Which screen's reading a finished piece of work changed.
 *
 * A repair carried out or put back changes what the checks would find. A backup
 * written, a download let go, room taken back, or anything taken off the disk,
 * changes the disk screen. The quality choice put back, a setting changed, the
 * line declared or a service chosen to fill a capability changes the settings
 * screen. An account offered or a request ruled on changes
 * the household. A command kept running or taken back changes the overview.
 * Each of those is read again, and anything else changed no reading.
 */
import type { Came } from "./came";
import { changedTheSettings } from "./configuring";
import { changedTheHosting } from "./hosting";
import { changedTheChecks } from "./mending";
import { changedTheDisk } from "./removing";
import { changedByReclaiming } from "./reclaiming";
import { changedByFilling } from "./filling";
import { changedByMoving } from "./moving";
import { changedBySeeding } from "./seeding";
import type { Place } from "./route";
import { changedTheLine } from "./sharing";
import { changedTheHousehold } from "./tending";
import { changedTheQuality } from "./tuning";
import { changedTheBackups } from "./upkeep";

/** Each change, and the screen whose reading it changed. */
const CHANGES: readonly (readonly [(came: Came) => boolean, Place])[] = [
  [changedTheChecks, "checks"],
  [changedTheBackups, "storage"],
  [changedTheDisk, "storage"],
  [changedBySeeding, "storage"],
  [changedByReclaiming, "storage"],
  [changedTheQuality, "settings"],
  [changedTheSettings, "settings"],
  [changedTheLine, "settings"],
  [changedByFilling, "settings"],
  [changedByMoving, "checks"],
  [changedTheHousehold, "requests"],
  [changedTheHosting, "overview"],
];

/** The screen whose reading what a piece of work came to changed, if any. */
export function placeChangedBy(came: Came): Place | undefined {
  return CHANGES.find(([changed]) => changed(came))?.[1];
}
