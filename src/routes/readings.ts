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
import type { Configured } from "../lib/configured";
import type { Inventory } from "../lib/credentials";
import type { Archives } from "../lib/kept";
import type { Leaving } from "../lib/leaving";
import type { Reckoned } from "../lib/letting";
import type { Shared } from "../lib/shared";
import type { Tuned } from "../lib/tuned";
import type { Diagnosis } from "../lib/wire";

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
  const [quality, settings, line, outbound, credentials] = await Promise.all([
    asked(reaching, "quality", "quality"),
    asked(reaching, "config", "config"),
    asked(reaching, "bandwidth", "bandwidth"),
    asked(reaching, "outbound", "outbound"),
    asked(reaching, "credentials", "credentials"),
  ]);
  return {
    read: { quality, settings, line, outbound, credentials },
    refused: turnedAway(quality, settings, line, outbound, credentials),
  };
}
