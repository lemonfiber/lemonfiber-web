/**
 * What running a run-and-exit service at once is answered with, as a suite
 * stands it in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has.
 */
import type { Ran } from "../lib/ran";

/** A rehearsal that found nothing holding a run back. */
export const wouldRun: Ran = {
  service: "configarr",
  rehearsed: true,
  due: true,
  skipped: 0,
};

/** A rehearsal held back, in lemonfiber's own words. */
export const heldBack: Ran = {
  ...wouldRun,
  due: false,
  held: "A run of configarr is already going.",
};

/** A run that went, and how it ended. */
export const wentNow: Ran = {
  service: "configarr",
  rehearsed: false,
  due: true,
  skipped: 2,
  ran: {
    started: 1_790_000_000,
    ended: 1_790_000_030,
    exit: 0,
    log: ["profile sync began", "profile sync ended"],
  },
};
