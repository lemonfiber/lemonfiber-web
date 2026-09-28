/**
 * Pairing a phone with this stack, and how the asking reads.
 *
 * One request, named as the endpoint names it. It is made rather than read:
 * the first one mints the stack's own identifier, and the material expires, so
 * each asking makes fresh material. It carries no credential and admits
 * nobody, so it is not asked about before it is sent.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Paired } from "./paired";
import type { Pairing, Requested, Work } from "./work";

/** Every request the pairing panel makes. */
export const everyPairing: readonly Pairing[] = ["companion-pair"];

/** Whether a record is of something the pairing panel asked for. */
export function isPairing(doing: Requested): doing is Pairing {
  const pairing: readonly Requested[] = everyPairing;
  return pairing.includes(doing);
}

/** One asking: fresh pairing material. */
export interface Pair {
  readonly doing: Pairing;
}

/** What to send for an asking, which is nothing: the stack names everything. */
export function givenForPair(): Arguments {
  return {};
}

/** How the pairing panel's request is asked for. */
export const pairing: Family<Pair> = {
  owns: isPairing,
  question: () => undefined,
  given: givenForPair,
  same: sameDoing,
};

/**
 * The material standing on the screen, where there is some: the newest the
 * panel asked for, once it came back.
 */
export function standingMaterial(work: readonly Work[]): Paired | undefined {
  const newest = work.find((one) => one.doing === "companion-pair");
  if (newest?.at !== "done" || newest.came.kind !== "pairing") return undefined;
  return newest.came.report;
}

/**
 * Everything the pairing panel is given to act with, and what pressing its
 * control asks for.
 */
export type Pairer = Asker<Pair>;
