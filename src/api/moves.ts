/**
 * What acting on a setup already here came to, as a suite stands it in for a
 * running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Adopted, Beside, Imported, Replaced } from "../lib/moved";
import { olderSonarr } from "./surveys";

/** Adopting the media project, still to be agreed to. */
export const wouldAdopt: Adopted = {
  stance: "pending",
  rehearsed: false,
  project: "media",
  back_up: ["/srv/sonarr", "/srv/radarr"],
  upgrades: [olderSonarr],
};

/** The media project adopted, with the backup it took. */
export const adopted: Adopted = {
  ...wouldAdopt,
  stance: "applied",
  backed_up: "/srv/lemonfiber/adopt-media.tar",
};

/** Adopting refused, in lemonfiber's words. */
export const adoptRefused: Adopted = {
  stance: "blocked",
  rehearsed: false,
  refusal: "Two projects could be adopted; name one.",
  back_up: [],
  upgrades: [],
};

/** Standing beside, still to be agreed to. */
export const wouldStandBeside: Beside = {
  stance: "pending",
  rehearsed: false,
  ports: [{ service: "sonarr", from: 8989, to: 18989 }],
};

/** Standing beside, written. */
export const besideWritten: Beside = {
  ...wouldStandBeside,
  stance: "applied",
  written: "/srv/lemonfiber/compose.beside.yml",
};

/** Importing, still to be agreed to. */
export const wouldImport: Imported = {
  stance: "pending",
  rehearsed: false,
  project: "media",
  would_carry: [{ kind: "series", name: "Bluey", service: "sonarr" }],
  carried: [],
  not_carried: [{ what: "media/cron-helper", because: "It keeps no records." }],
};

/** The records imported. */
export const imported: Imported = {
  ...wouldImport,
  stance: "applied",
  would_carry: [],
  carried: [{ kind: "series", name: "Bluey", service: "sonarr" }],
};

/** Replacing the media project, still to be agreed to under its offer. */
export const wouldReplace: Replaced = {
  agreement: "media:sonarr,radarr",
  stance: "pending",
  rehearsed: false,
  project: "media",
  would_stop: ["sonarr", "radarr"],
  stopped: [],
  still_running: [],
};

/** Replacing, where one service would not stop. */
export const replacedPartly: Replaced = {
  ...wouldReplace,
  stance: "applied",
  would_stop: [],
  stopped: ["sonarr"],
  still_running: ["radarr"],
};
