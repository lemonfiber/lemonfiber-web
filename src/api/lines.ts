/**
 * How the line is shared, what pausing every download came to, and what
 * moving onto this build's pins would come to, as a suite stands them in for a
 * running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Paused } from "../lib/paused";
import type { Shared } from "../lib/shared";
import type { Updated } from "../lib/updated";

/** What the household is told the limits mean. */
export const means =
  "In the household's hours, downloads take half the line and uploads a fifth.";

/** How the line is shared in the household's hours, as a reading answers. */
export const shared: Shared = {
  rehearsed: false,
  applied: false,
  cautions: ["The line was measured once, a week ago."],
  clients: [
    {
      client: "qbittorrent",
      answer: {
        answered: "held",
        down: { verdict: "holding", asked: 6_250_000, accepted: 6_250_000 },
        up: { verdict: "overrunning", asked: 500_000, moving: 900_000 },
      },
    },
    {
      client: "sabnzbd",
      answer: { answered: "silent", said: "It did not answer in time." },
    },
  ],
  down: {
    limit: { as: "share", at: 50 },
    resolved: { is: "at", bytes_per_second: 6_250_000 },
    says: "Downloads may take 50% of a 100 Mbit line.",
  },
  means,
  respite: { standing: "none" },
  restraint: "scheduled-active",
  untouched: ["Streaming to the household is never limited."],
  up: {
    limit: { as: "share", at: 20 },
    resolved: { is: "at", bytes_per_second: 500_000 },
    says: "Uploads may take 20% of a 20 Mbit line.",
  },
};

/** The same line once a declaration was written to the clients. */
export const declared: Shared = {
  ...shared,
  applied: true,
  ratio: "Holding uploads back makes some trackers slower to give.",
  respite_says: null,
  acting: null,
};

/** Why one download client could not be asked to pause. */
export const unreached = "Connection refused at sabnzbd:8080.";

/** Every download client paused: one stopped, and one nobody reached. */
export const paused: Paused = {
  asked: "pause",
  rehearsed: false,
  clients: [
    { client: "qbittorrent", was: "fetching", now: "stopped" },
    { client: "sabnzbd", unreached },
  ],
};

/** What a resume runs into while a spent cap holds the clients. */
export const capped =
  "The month's cap is spent, so the next check of the line stops them again.";

/** Every download client resumed under a spent cap. */
export const resumed: Paused = {
  asked: "resume",
  rehearsed: false,
  caution: capped,
  clients: [{ client: "qbittorrent", was: "stopped", now: "fetching" }],
};

/** A steps plan: two services behind their pins, one of them a one-way step. */
export const plan: Updated = {
  rehearsed: false,
  applied: [],
  changelog: { releases: [], requirements: {}, state: "current" },
  changes: [
    {
      service: "sonarr",
      current: "4.0.8",
      target: "4.0.9",
      jump: "patch",
      irreversible: false,
      refused: false,
      because: "Fixes a crash on import.",
    },
    {
      service: "jellyfin",
      current: "10.10.3",
      target: "10.11.0",
      jump: "minor",
      irreversible: true,
      refused: false,
      because: "Its library is migrated on first start.",
    },
  ],
  confirmed: false,
  in_flight: ["A film still coming down"],
  stack_edits: [],
  state: "updates-available",
};

/** What taking that plan came to. */
export const moved: Updated = {
  ...plan,
  applied: [
    {
      service: "sonarr",
      from: "4.0.8",
      to: "4.0.9",
      ending: "updated",
      reversal: "rollback",
    },
    {
      service: "jellyfin",
      from: "10.10.3",
      to: "10.11.0",
      ending: "not-started",
      reversal: "restore",
      detail: "It exited while migrating its library.",
    },
  ],
  backup: "Backed up to /srv/lemonfiber/backups/before-update.tar.gz.",
  confirmed: true,
  halted: "Jellyfin did not come back, so the run stopped there.",
  state: "partial",
};
