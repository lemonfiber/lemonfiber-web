/**
 * Moving the stack onto the versions this build pins, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice. Unconfirmed
 * it changes nothing and answers with every step it would take and what each
 * means. The yes is the same request, confirmed, and it carries whether what
 * the download clients are still working on is let finish first where the plan
 * names anything they are.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Step } from "./updated";
import type { Requested, Updating, Work } from "./work";

/** Every request the updates panel makes. */
export const everyUpdating: readonly Updating[] = ["update"];

/** Whether a record is of something the updates panel asked for. */
export function isUpdating(doing: Requested): doing is Updating {
  const updating: readonly Requested[] = everyUpdating;
  return updating.includes(doing);
}

/** One asking. */
export type Update =
  /** What moving onto the pins would change, with nothing changed. */
  | { readonly doing: "update" }
  /** The move made, agreed to after reading what it would change. */
  | {
      readonly doing: "update";
      readonly confirm: true;
      readonly wait: boolean;
    };

/** What to send for one asking. */
export function givenForUpdate(update: Update): Arguments {
  return "confirm" in update ? { confirm: true, wait: update.wait } : {};
}

/** How the updates panel's requests are asked for. */
export const updating: Family<Update> = {
  owns: isUpdating,
  question: () => undefined,
  given: givenForUpdate,
  same: sameDoing,
};

/** A plan standing for a yes, and the record it came on. */
export interface Plan {
  /** The record, which is what putting the plan away puts away. */
  readonly id: string;
  /** Every step it would take. */
  readonly steps: readonly Step[];
  /** What the download clients are still working on. */
  readonly inFlight: readonly string[];
}

/**
 * The plan standing on the screen, where one is: the newest update asked for,
 * answered with steps to take and not yet agreed to.
 */
export function standingPlan(work: readonly Work[]): Plan | undefined {
  const newest = work.find((one) => one.doing === "update");
  if (newest?.at !== "done" || newest.came.kind !== "update") return undefined;
  const { report } = newest.came;
  if (report.confirmed || report.state !== "updates-available") {
    return undefined;
  }
  return { id: newest.id, steps: report.changes, inFlight: report.in_flight };
}

/**
 * Everything the updates panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Updater = Asker<Update>;
