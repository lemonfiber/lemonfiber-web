/**
 * What the operator is told about, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Alerts } from "../lib/alerts";

/** The quiet preset, with one kind always told and one never told. */
export const alerts: Alerts = {
  preset: "quiet",
  means: "You are told when something stops working, and about nothing else.",
  exceptions: [
    { kind: "disk-filling", wanted: true },
    { kind: "update-available", wanted: false },
  ],
  changed: false,
  rehearsed: false,
};
