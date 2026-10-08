/**
 * What is already on a machine, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Carrying, Linking, Mode, Occupant, Survey } from "../lib/survey";

/** A Sonarr lemonfiber knows, running and holding its usual port. */
export const sonarr: Occupant = {
  service: "sonarr",
  running: true,
  ports: [8989],
  adoptable: true,
};

/** A helper container lemonfiber does not know, stopped and publishing nothing. */
export const helper: Occupant = {
  service: "cron-helper",
  running: false,
  ports: [],
  adoptable: false,
};

/** Sonarr is older here, so its database is backed up before it is opened. */
export const olderSonarr: Carrying = {
  service: "sonarr",
  existing: "3.0.10",
  ours: "4.0.9",
  verdict: "ours",
  because: "Sonarr upgrades its database the first time 4.0.9 opens it.",
  backup_first: true,
  refused: false,
};

/** A newer Radarr than lemonfiber pins, which lemonfiber will not downgrade. */
export const newerRadarr: Carrying = {
  service: "radarr",
  existing: "6.0.0",
  ours: "5.8.3",
  verdict: "existing",
  because: "Its database cannot be opened by an older Radarr.",
  backup_first: false,
  refused: true,
};

/** Adopting, offered already chosen, and leaving what runs alone. */
export const adopt: Mode = {
  mode: "adopt",
  what: "lemonfiber runs what is here as it stands.",
  disturbs: false,
  preselected: true,
};

/** Replacing, which stops what is running. */
export const replace: Mode = {
  mode: "replace",
  what: "lemonfiber stops what is here and runs its own.",
  disturbs: true,
  preselected: false,
};

/** A library and its downloads on separate filesystems. */
export const separate: Linking = {
  filesystems: ["/mnt/tv", "/mnt/downloads"],
  because: "/mnt/tv and /mnt/downloads are separate filesystems.",
  cost: "Every import is copied, so it takes its size twice.",
  forced: false,
  links: false,
  remedy: "Put the library and the downloads on one filesystem.",
};

/** One project of somebody else's, with everything the survey can say about it. */
export const survey: Survey = {
  read: true,
  standing: [{ project: "media", services: [sonarr, helper] }],
  conflicts: [{ port: 8989, held_by: "media", wanted_by: "sonarr" }],
  beside: [{ service: "sonarr", from: 8989, to: 18989 }],
  carrying: [olderSonarr, newerRadarr],
  linking: separate,
  modes: [adopt, replace],
  unsupported: [
    { what: "media/cron-helper", because: "lemonfiber does not know it." },
  ],
  not_carried: [
    { what: "Custom scripts", because: "They are not part of any service." },
  ],
};

/** A survey that could not ask the container engine. */
export const unread: Survey = {
  read: false,
  standing: [],
  conflicts: [],
  beside: [],
  carrying: [],
  modes: [],
  unsupported: [],
  not_carried: [],
};
