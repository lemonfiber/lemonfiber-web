/**
 * What the disk and settings screens are drawn from, asked for together.
 *
 * Each of the two screens is drawn from several readings that answer once, and
 * they are asked for at the same time on the way in and stamped together. The
 * screen is handed the set; one reading that could not be read says so in the
 * panel it feeds and leaves the rest drawn.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { asked, turnedAway, type Reaching } from "../api/asking";
import type { Alerts } from "../lib/alerts";
import type { Catalogue, Provenance } from "../lib/catalogue";
import type { Configured } from "../lib/configured";
import type { Standing, Versions } from "../lib/copy";
import type { Inventory } from "../lib/credentials";
import type { Archives } from "../lib/kept";
import type { Leaving } from "../lib/leaving";
import type { Reckoned } from "../lib/letting";
import type { Shared } from "../lib/shared";
import type { Tuned } from "../lib/tuned";
import type { Plugins } from "../lib/plugins";
import type { Diagnosis } from "../lib/wire";
import type { Wiring } from "../lib/wiring";

/** What the disk screen is drawn from, beside the figures the stream carries. */
export interface StorageRead {
  /** What the checks about the disk found. */
  readonly diagnosis: Reading<Diagnosis>;
  /** The backups kept. */
  readonly archives: Reading<Archives>;
  /** The disk accounting. */
  readonly space: Reading<Reckoned>;
}

/** What the settings screen is drawn from. */
export interface SettingsRead {
  /** The quality choice in force. */
  readonly quality: Reading<Tuned>;
  /** Every setting lemonfiber keeps. */
  readonly settings: Reading<Configured>;
  /** How the line is shared. */
  readonly line: Reading<Shared>;
  /** Everything that leaves this machine. */
  readonly outbound: Reading<Leaving>;
  /** Every credential the stack holds, without values. */
  readonly credentials: Reading<Inventory>;
  /** The versions in play. */
  readonly versions: Reading<Versions>;
  /** Where this copy of lemonfiber stands against the newest release. */
  readonly standing: Reading<Standing>;
  /** What each service is for, and what the stack has dropped. */
  readonly catalogue: Reading<Catalogue>;
  /** Where each service comes from. */
  readonly provenance: Reading<Provenance>;
  /** What the operator is told about. */
  readonly alerts: Reading<Alerts>;
  /** What the stack wires to what. */
  readonly wiring: Reading<Wiring>;
  /** The plugins on this machine. */
  readonly plugins: Reading<Plugins>;
}

/** A screen's readings, and whether any of them was turned away. */
export interface Answered<T> {
  /** The readings. */
  readonly read: T;
  /** Whether lemonfiber refused this run's key for any of them. */
  readonly refused: boolean;
}

/** Ask everything the disk screen is drawn from. */
export async function readStorage(
  reaching: Reaching,
): Promise<Answered<StorageRead>> {
  const [diagnosis, archives, space] = await Promise.all([
    asked(reaching, "storage", "doctor"),
    asked(reaching, "backups", "archives"),
    asked(reaching, "space", "space"),
  ]);
  return {
    read: { diagnosis, archives, space },
    refused: turnedAway(diagnosis, archives, space),
  };
}

/** Ask everything the settings screen is drawn from. */
export async function readSettings(
  reaching: Reaching,
): Promise<Answered<SettingsRead>> {
  const read = await Promise.all([
    asked(reaching, "quality", "quality"),
    asked(reaching, "config", "config"),
    asked(reaching, "bandwidth", "bandwidth"),
    asked(reaching, "outbound", "outbound"),
    asked(reaching, "credentials", "credentials"),
    asked(reaching, "version", "version"),
    asked(reaching, "update", "self-update", { what: "self" }),
    asked(reaching, "catalogue", "catalogue"),
    asked(reaching, "provenance", "provenance"),
    asked(reaching, "alerts", "alerts"),
    asked(reaching, "wiring", "wiring"),
    asked(reaching, "plugins", "plugins"),
  ]);
  const [
    quality,
    settings,
    line,
    outbound,
    credentials,
    versions,
    standing,
    catalogue,
    provenance,
    alerts,
    wiring,
    plugins,
  ] = read;
  return {
    read: {
      quality,
      settings,
      line,
      outbound,
      credentials,
      versions,
      standing,
      catalogue,
      provenance,
      alerts,
      wiring,
      plugins,
    },
    refused: turnedAway(...read),
  };
}
