/**
 * Where one item is, what walking one thing through came to, and how a guard
 * over the data location ended, as a suite stands them in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Guarded, Traced, Walked } from "../lib/traced";

/** A series half here, stalled on one season, followed on fuzzy names. */
export const traced: Traced = {
  item: "The Expanse",
  matched: true,
  furthest: "downloading",
  stall: "The download client has been waiting for peers for two days.",
  confidence: "uncertain",
  coverage: { have: 12, wanted: 24, unmonitored: 0, seasons: [] },
  findings: ["Jellyfin holds an episode Sonarr has no record of."],
  history: [
    { outcome: "grabbed", at: "2026-09-20 21:04" },
    { outcome: "download-failed", at: "2026-09-21 03:10" },
  ],
  stages: [
    { stage: "monitored", service: "sonarr" },
    { stage: "grabbed", service: "sonarr", at: "2026-09-20 21:04" },
  ],
};

/** Something nobody asked for. */
export const unmatched: Traced = {
  ...traced,
  item: "Arrival",
  matched: false,
  stall: null,
  history: [],
  findings: [],
};

/** A walk that went all the way to the library. */
export const walked: Walked = {
  shape: "pipeline",
  state: "complete",
  item: "Big Buck Bunny",
  proves: "That a film can be found, fetched and put in the library.",
  already_here: false,
  in_background: false,
  lines: [
    { step: "searching", said: "Asking the indexers.", detail: "3 answered." },
    { step: "available", said: "It is ready to watch.", detail: "" },
  ],
  suggestions: [],
  link: "hardlinked",
  handover: { next: ["more-content", "household"] },
};

/** A walk that stopped, with what the services said and the one thing to try. */
export const stoppedWalk: Walked = {
  ...walked,
  state: "failed",
  lines: [],
  link: null,
  handover: null,
  stopped: {
    step: "searching",
    reason: "no-indexers",
    logs: ["Prowlarr: no indexers are configured."],
    remedy: "Add an indexer in Prowlarr, then walk it through again.",
  },
};

/** A guard that ended because the data location went away. */
export const guarded: Guarded = {
  rehearsed: false,
  forms: ["media"],
  reason: "The data location vanished, so the forms were stopped.",
  stopped: true,
};
