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
import type { Boot } from "../lib/boot";
import type { Healing } from "../lib/healing";
import type { History } from "../lib/history";
import type { Survey } from "../lib/survey";
import type { Watcher } from "../lib/watcher";
import type { Notified } from "../lib/notifying";
import type { Catalogue, Provenance } from "../lib/catalogue";
import type { Configured } from "../lib/configured";
import type { Standing, Versions } from "../lib/copy";
import type { Copying } from "../lib/copying";
import type { Inventory } from "../lib/credentials";
import type { Archives } from "../lib/kept";
import type { Leaving } from "../lib/leaving";
import type { Reckoned } from "../lib/letting";
import type { Shared } from "../lib/shared";
import type { Tuned } from "../lib/tuned";
import type { Plugins } from "../lib/plugins";
import type { Values } from "../lib/values";
import type { Diagnosis } from "../lib/wire";
import type { Wiring } from "../lib/wiring";

/** What the checks screen is drawn from. */
export interface ChecksRead {
  /** What the checks found. */
  readonly diagnosis: Reading<Diagnosis>;
  /** Everything lemonfiber changed. */
  readonly history: Reading<History>;
  /** What is already on this machine that is not lemonfiber's. */
  readonly survey: Reading<Survey>;
  /** When this machine last started, and what the check after it came to. */
  readonly boot: Reading<Boot>;
  /** What watches the stack from outside it. */
  readonly watcher: Reading<Watcher>;
  /** The self-healing of stuck downloads. */
  readonly healing: Reading<Healing>;
}

/** What the disk screen is drawn from, beside the figures the stream carries. */
export interface StorageRead {
  /** What the checks about the disk found. */
  readonly diagnosis: Reading<Diagnosis>;
  /** The backups kept. */
  readonly archives: Reading<Archives>;
  /** The disk accounting. */
  readonly space: Reading<Reckoned>;
  /** The backup or restore running now, or none. */
  readonly copying: Reading<Copying>;
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
  /** Where alerts go. */
  readonly notify: Reading<Notified>;
  /** What the stack wires to what. */
  readonly wiring: Reading<Wiring>;
  /** The plugins on this machine. */
  readonly plugins: Reading<Plugins>;
  /** Every setting and secret the services read, without a secret's value. */
  readonly values: Reading<Values>;
}

/** A screen's readings, and whether any of them was turned away. */
export interface Answered<T> {
  /** The readings. */
  readonly read: T;
  /** Whether lemonfiber refused this run's key for any of them. */
  readonly refused: boolean;
}

/** Ask everything the checks screen is drawn from. */
export async function readChecks(
  reaching: Reaching,
): Promise<Answered<ChecksRead>> {
  const read = await Promise.all([
    asked(reaching, "checks", "doctor"),
    asked(reaching, "history", "history"),
    asked(reaching, "migration", "migration"),
    asked(reaching, "boot", "boot"),
    asked(reaching, "watcher", "watcher"),
    asked(reaching, "queue", "queue"),
  ]);
  const [diagnosis, history, survey, boot, watcher, healing] = read;
  return {
    read: { diagnosis, history, survey, boot, watcher, healing },
    refused: turnedAway(...read),
  };
}

/** Ask everything the disk screen is drawn from. */
export async function readStorage(
  reaching: Reaching,
): Promise<Answered<StorageRead>> {
  const [diagnosis, archives, space, copying] = await Promise.all([
    asked(reaching, "storage", "doctor"),
    asked(reaching, "backups", "archives"),
    asked(reaching, "space", "space"),
    asked(reaching, "copying", "copying"),
  ]);
  return {
    read: { diagnosis, archives, space, copying },
    refused: turnedAway(diagnosis, archives, space, copying),
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
    asked(reaching, "settings", "settings"),
    asked(reaching, "notify", "notify"),
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
    values,
    notify,
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
      values,
      notify,
    },
    refused: turnedAway(...read),
  };
}
