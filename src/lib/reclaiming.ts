/**
 * Taking back the room on the disk that costs nothing, and how the asking reads.
 *
 * One request, named as the command line names it. The disk accounting the
 * storage screen reads is the offer: it names what could be got back and what
 * each part would cost, and names itself. There is no bare yes: the yes is the
 * request carrying that name, so what is taken is what was read, or lemonfiber
 * refuses. Only what costs nothing is taken.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Reclaiming, Requested } from "./work";

/** Every request the room panel makes. */
export const everyReclaiming: readonly Reclaiming[] = ["space"];

/** Whether a record is of something the room panel asked for. */
export function isReclaiming(doing: Requested): doing is Reclaiming {
  const reclaiming: readonly Requested[] = everyReclaiming;
  return reclaiming.includes(doing);
}

/** The room that costs nothing taken back, under the offer that named itself. */
export interface Reclaim {
  readonly doing: "space";
  /** The name the accounting gave itself, which the yes carries. */
  readonly offer: string;
}

/** What to send for one asking. */
export function givenForReclaim(reclaim: Reclaim): Arguments {
  return { offer: reclaim.offer };
}

/** How the room panel's request is asked for. */
export const reclaiming: Family<Reclaim> = {
  owns: isReclaiming,
  question: () => undefined,
  given: givenForReclaim,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to took room back, which changes what the
 * disk screen reads. A rehearsal took nothing.
 */
export function changedByReclaiming(came: Came): boolean {
  if (came.kind !== "space") return false;
  const { reclaimed } = came.report;
  return reclaimed !== undefined && reclaimed !== null && !reclaimed.rehearsed;
}

/**
 * Everything the room panel is given to act with, and what pressing its
 * control asks for.
 */
export type Reclaimer = Asker<Reclaim>;
