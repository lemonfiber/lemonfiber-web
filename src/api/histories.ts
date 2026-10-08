/**
 * Everything lemonfiber changed, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Change, History } from "../lib/history";

/** A setting written by a seed, which can be put back whole. */
export const written: Change = {
  did: "Set Sonarr's download client to qBittorrent",
  operation: "seed",
  target: "sonarr",
  at: "1791400000",
  reversal: "whole",
  alongside: 1,
};

/** A fix made alongside two others, which can be put back only in part. */
export const fixed: Change = {
  did: "Moved the downloads folder onto the library's filesystem",
  operation: "an applied fix",
  target: "qbittorrent",
  at: "0",
  reversal: "partial",
  alongside: 3,
  because: "The files already moved stay where they are.",
  instead: "Move them back by hand if you want them where they were.",
};

/** Everything lemonfiber changed, newest first. */
export const changed: History = {
  horizon: "The record goes back to the first setup on this machine.",
  changes: [written, fixed],
};
