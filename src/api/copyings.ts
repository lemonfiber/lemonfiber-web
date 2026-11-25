/**
 * A backup or restore running, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Copying, Running } from "../lib/copying";

/** A backup of the whole stack, writing as fast as it can. */
export const backingUp: Running = {
  what: "backup",
  scope: { scope: "whole_stack" },
  started: 1795563600,
  written: 734003200,
  whole: 2147483648,
  part: "sonarr database",
  state: "working",
};

/** The same backup, held to the operator's limit. */
export const pacedBackup: Extract<Running, { state: "paced" }> = {
  ...backingUp,
  state: "paced",
  limit: 52428800,
};

/** A restore that has written nothing for a while. */
export const stalledRestore: Extract<Running, { state: "stalled" }> = {
  what: "restore",
  scope: { scope: "whole_stack" },
  started: 1795563600,
  written: 1073741824,
  whole: 2147483648,
  part: "radarr settings",
  state: "stalled",
  wrote: 1795564200,
};

/** A copy running, as the read and the stream answer it. */
export const copyingNow: Copying = { running: backingUp };

/** No copy running. */
export const copyingNone: Copying = { running: null };
