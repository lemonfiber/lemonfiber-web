/**
 * Changing one setting, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice where the
 * change costs something. lemonfiber classifies every change: a cheap one is
 * made at once, and a consequential one is staged and answered with the review
 * (the value in force against the one proposed, and everything the change
 * stops, keeps, asks for or interrupts). The yes is the same change,
 * confirmed, and it carries whether what is still coming down is let finish
 * first where the review says something is.
 *
 * The words live in `messages/`. What lemonfiber writes into a review is its
 * own and is passed through unchanged.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Configured } from "./configured";
import type { Configuring, Requested, Work } from "./work";

/** Every request the settings panel makes. */
export const everyConfiguring: readonly Configuring[] = ["config-set"];

/** Whether a record is of something the settings panel asked for. */
export function isConfiguring(doing: Requested): doing is Configuring {
  const configuring: readonly Requested[] = everyConfiguring;
  return configuring.includes(doing);
}

/** One asking, with whatever it names. */
export type Change =
  /** One setting given a new value, made at once where it costs nothing. */
  | {
      readonly doing: "config-set";
      readonly key: string;
      readonly value: string;
    }
  /** The same change, agreed to after reading its review. */
  | {
      readonly doing: "config-set";
      readonly key: string;
      readonly value: string;
      readonly confirm: true;
      readonly wait: boolean;
    };

/** What to send for one asking. */
export function givenForChange(change: Change): Arguments {
  const { key, value } = change;
  return "confirm" in change
    ? { key, value, confirm: true, wait: change.wait }
    : { key, value };
}

/** How the settings panel's requests are asked for. */
export const configuring: Family<Change> = {
  owns: isConfiguring,
  question: () => undefined,
  given: givenForChange,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed a setting, which is what the
 * settings panel draws.
 */
export function changedTheSettings(came: Came): boolean {
  return came.kind === "config" && came.report.review?.stance === "applied";
}

/** A change staged for a yes, and the record its review came on. */
export interface Staged {
  /** The record, which is what putting the review away puts away. */
  readonly id: string;
  /** The setting, which the yes names again. */
  readonly key: string;
  /** The value proposed, which the yes sends again. */
  readonly value: string;
  /** Whether something is still coming down that the change would interrupt. */
  readonly interrupts: boolean;
}

/** The review a change came back with, where it staged one. */
function stagedIn(came: Came): Configured | undefined {
  if (came.kind !== "config") return undefined;
  return came.report.review?.stance === "pending" ? came.report : undefined;
}

/**
 * The change staged on the screen, where one is.
 *
 * Only the newest change counts. A change asked for again replaces the review
 * before it, and one that has been answered is no longer one to agree to.
 */
export function standingChange(work: readonly Work[]): Staged | undefined {
  const newest = work.find((one) => one.doing === "config-set");
  if (newest?.at !== "done") return undefined;
  const staged = stagedIn(newest.came);
  const { key, value } = newest.given;
  if (staged === undefined || key === undefined || value === undefined) {
    return undefined;
  }
  const active = staged.review?.findings?.active ?? [];
  return { id: newest.id, key, value, interrupts: active.length > 0 };
}

/**
 * Everything the settings panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Configurer = Asker<Change>;
