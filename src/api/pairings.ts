/**
 * What making pairing material is answered with, as a suite stands it in for
 * a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Paired } from "../lib/paired";

/** The address a paired phone reaches, on the household network. */
export const reachAt = ["https:", "", "lemonfiber.local:8443"].join("/");

/** A certificate's fingerprint whose short form the spec states. */
const zeroes = "0".repeat(64);

/** The short form the spec states for that fingerprint. */
export const zeroesForm = "22VK-KPHH-NKH9-TUWA";

/** What would make every paired phone refuse this machine. */
export const replacing =
  "Replacing the certificate this address presents makes every paired phone refuse this machine until it is paired again.";

/** Fresh pairing material, as the one line a phone reads. */
export const material: Paired = {
  caution: null,
  compare: zeroesForm,
  material: {
    address: reachAt,
    expires: 1_790_000_000,
    fingerprint: zeroes,
    stack: "c1d2e3f4a5b6",
  },
  replacing,
  until: "28 September 2026 at 21:00",
  written: "lemonfiber-pair:v1:c1d2e3f4a5b6",
};
