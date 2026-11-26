/**
 * The machine's health, as a suite stands it in for a running lemonfiber:
 * starting with the machine, what watches the stack from outside, the
 * self-healing of stuck downloads and where alerts go.
 *
 * Declared as the payload each kind carries, so the compiler asks whether
 * each field is one the contract has.
 */
import type { Boot, Verification } from "../lib/boot";
import type { Healing, Run, Wedged } from "../lib/healing";
import type { Backend, Notified } from "../lib/notifying";
import type { Monitor, Watcher } from "../lib/watcher";

/** A check after a start that brought everything back. */
export const passed: Verification = {
  at: 1_791_400_060,
  against: 1_791_400_000,
  outcome: "passed",
  tunnel: { state: "held" },
  port: { was: 51_413, now: 51_413, pushed: true },
};

/** A check after an earlier start that left two services down. */
export const failed: Verification = {
  at: 1_791_300_060,
  outcome: "failed",
  not_back: ["sonarr", "radarr"],
  tunnel: {
    state: "not-established",
    said: "The tunnel's handshake timed out.",
  },
  port: { was: 51_413, pushed: false },
  said: "Two services did not come back after the start.",
};

/** The machine started, and the check after it passed. */
export const booted: Boot = {
  booted_at: 1_791_400_000,
  verified: passed,
  last_verified: passed,
};

/** The machine started, no check ran after it, and the stack has failed to come back. */
export const notBack: Boot = {
  booted_at: 1_791_400_000,
  last_verified: failed,
  failing_since: 1_791_300_000,
  failed_boots: 2,
  declined: "Starting with the machine is switched off.",
};

/** A monitor lemonfiber made over the household's way in. */
export const door: Monitor = {
  name: "Jellyfin from home",
  kind: "http",
  state: "up",
  since: 1_791_400_100,
  active: true,
  last_reading: 1_791_400_500,
  path: "household",
  covers: { "entry-point": "jellyfin" },
};

/** A heartbeat nothing has checked in with, watching the wrong thing. */
export const beat: Monitor = {
  name: "Nightly backup",
  kind: "heartbeat",
  state: "not-reporting",
  since: 1_791_300_000,
  active: false,
  heartbeat: { every_s: 86_400, grace_s: 600 },
  covers: { job: "backup" },
  unconfigured: {
    wanted: "the nightly backup",
    watches: "nothing",
    why: "The job has no address to check in at.",
  },
};

/** The outside watcher, answering, with what it does not cover. */
export const watched: Watcher = {
  watcher: "uptime-kuma",
  reachable: true,
  read_at: 1_791_400_600,
  monitors: [door, beat],
  uncovered: [{ service: "prowlarr" }],
};

/** The outside watcher, not answering. */
export const blind: Watcher = {
  watcher: "uptime-kuma",
  reachable: false,
  read_at: 1_791_400_600,
  unreachable_because: "It refused the key lemonfiber holds.",
};

/** A download stalled under a curator. */
export const stalled: Wedged = {
  title: "Arrival",
  release: "Arrival.2016.2160p",
  service: "radarr",
  class: "stalled",
  why: "Nothing has moved for an hour.",
  strikes: 3,
  added_at: 1_791_390_000,
  next: ["remove", "blocklist", "search"],
};

/** A download no curator waits for, still left alone. */
export const orphan: Wedged = {
  release: "some.release",
  service: "qbittorrent",
  class: "orphaned",
  why: "No curator holds it.",
  strikes: 1,
  in_grace_until: 1_791_401_000,
};

/** A run that acted, one act falling back to something weaker. */
export const acted: Run = {
  at: 1_791_400_000,
  rehearsed: false,
  items: [
    {
      title: "Dune",
      release: "Dune.2021",
      service: "radarr",
      why: "stalled",
      acts: [
        { act: "remove", outcome: "done" },
        {
          act: "blocklist",
          outcome: "fell-back",
          instead: "remove",
          why: "The curator refused it.",
        },
      ],
    },
  ],
};

/** A rehearsal that found nothing struck out. */
export const rehearsal: Run = { at: 1_791_390_000, rehearsed: true };

/** Healing on, with two unhealthy items and two runs. */
export const healing: Healing = {
  healing: "on",
  strikes_needed: 3,
  grace_s: 3600,
  classified_at: 1_791_400_700,
  incomplete: true,
  rehearsed: false,
  mismatch: "qBittorrent files Radarr's downloads outside its folder.",
  unreachable: [{ service: "sabnzbd", why: "It did not answer." }],
  items: [stalled, orphan],
  runs: [acted, rehearsal],
};

/** Healing off, and nothing unhealthy. */
export const quiet: Healing = {
  healing: "off",
  strikes_needed: 3,
  grace_s: 90,
  incomplete: false,
  rehearsed: false,
};

/** A back-end the operator chose, proven, with a failure since. */
export const ntfy: Backend = {
  id: "phone",
  kind: "ntfy",
  where: "ntfy.sh/house-alerts",
  chosen_by: "operator",
  proof: { proven: 1_791_300_000 },
  hosted: { host: "ntfy.sh", leaves: ["what happened", "when"] },
  last: { at: 1_791_400_000, kind: "problem", outcome: { failed: "503" } },
  failures: [
    { at: 1_791_400_000, kind: "problem", outcome: { failed: "503" } },
  ],
  retry: { attempt: 2, of: 5, next: 1_791_400_300 },
};

/** A back-end a member chose, held until it is proven again. */
export const webhook: Backend = {
  id: "kits-hook",
  kind: "webhook",
  where: "hooks.example.org/kit",
  chosen_by: { member: "kit" },
  proof: { held: "Its last test was refused." },
  failures: [],
};

/** Where alerts go: one way degraded, one held, and one unread. */
export const notified: Notified = {
  state: "degraded",
  rehearsed: false,
  backends: [ntfy, webhook],
  unread: [{ backend: "old", because: "Its record is damaged." }],
};
