/**
 * Choosing which service fills a capability, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice about one
 * capability and the service chosen for it. Asked as a rehearsal it writes
 * nothing and answers with what the choice would come to and a name for that
 * offer. There is no bare yes: the yes is the same choice carrying that name,
 * so what is written is what was read, or lemonfiber refuses and says what
 * moved.
 *
 * Only an ask several services claim has a choice to make: one nobody has
 * chosen between, which reaches none of them, and one already chosen, which
 * can be chosen again.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Wiring } from "./wiring";
import type { Filling, Requested, Work } from "./work";

/** Every request the wiring panel makes. */
export const everyFilling: readonly Filling[] = ["wiring-fill"];

/** Whether a record is of something the wiring panel asked for. */
export function isFilling(doing: Requested): doing is Filling {
  const filling: readonly Requested[] = everyFilling;
  return filling.includes(doing);
}

/** One choice: the capability, the service chosen, and why, where said. */
export interface Choice {
  readonly capability: string;
  readonly service: string;
  /** What the operator said about it, or nothing where they said nothing. */
  readonly reason: string | undefined;
}

/** One asking, about one choice. */
export type Fill =
  /** What the choice would come to, with nothing written. */
  | ({ readonly doing: "wiring-fill" } & Choice)
  /** The choice written, agreed to under the offer that named itself. */
  | ({ readonly doing: "wiring-fill"; readonly offer: string } & Choice);

/** What to send for one asking. */
export function givenForFill(fill: Fill): Arguments {
  const choice = {
    capability: fill.capability,
    service: fill.service,
    ...(fill.reason === undefined ? {} : { reason: fill.reason }),
  };
  return "offer" in fill
    ? { ...choice, offer: fill.offer }
    : { ...choice, dry_run: true };
}

/** How the wiring panel's request is asked for. */
export const filling: Family<Fill> = {
  owns: isFilling,
  question: () => undefined,
  given: givenForFill,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed what the stack wires to what,
 * which changes what the settings screen reads. A rehearsal wrote nothing.
 */
export function changedByFilling(came: Came): boolean {
  return came.kind === "substitution" && came.report.applied;
}

/** An offer standing for a yes, and the record it came on. */
export interface Offered extends Choice {
  /** The record, which is what putting the offer away puts away. */
  readonly id: string;
  /** The name the offer gave itself, which the yes carries. */
  readonly offer: string;
}

/**
 * The offer standing on the screen, where one is: the newest choice asked
 * for, answered with what it would come to and nothing written.
 */
export function standingFill(work: readonly Work[]): Offered | undefined {
  const newest = work.find((one) => one.doing === "wiring-fill");
  if (newest?.at !== "done" || newest.came.kind !== "substitution") {
    return undefined;
  }
  const { report } = newest.came;
  if (report.applied) return undefined;
  const { capability, now, why } = report.substitution;
  return {
    id: newest.id,
    capability,
    service: now,
    reason: why === undefined || why === null || why === "" ? undefined : why,
    offer: report.agreement,
  };
}

/** A capability several services claim, and every one that could fill it. */
export interface Choosable {
  readonly capability: string;
  readonly candidates: readonly string[];
  /** The one filling it now, where one was chosen. */
  readonly chosen: string | undefined;
}

/**
 * Every capability there is a choice to make about, once each, in the order
 * the links name them: one nobody has chosen between, and one already chosen,
 * with the service chosen first.
 */
export function choosable(wiring: Wiring): readonly Choosable[] {
  const found = new Map<string, Choosable>();
  for (const link of wiring.wired) {
    const { reaches } = link;
    if (reaches.how !== "asked" || found.has(reaches.capability)) continue;
    const { settled } = reaches;
    if (settled.settled === "contested") {
      found.set(reaches.capability, {
        capability: reaches.capability,
        candidates: settled.claimants,
        chosen: undefined,
      });
    } else if (settled.settled === "chosen") {
      found.set(reaches.capability, {
        capability: reaches.capability,
        candidates: [...reaches.services, ...settled.over],
        chosen: reaches.services[0],
      });
    }
  }
  return [...found.values()];
}

/**
 * Everything the wiring panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Filler = Asker<Fill>;
