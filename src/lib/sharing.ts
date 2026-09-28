/**
 * Declaring how the line is shared, and how the asking reads.
 *
 * One request, named as the command line names it. A declaration is carried as
 * it was written and read by lemonfiber, which answers with how the line is
 * shared once it is made: a surface that decided what `50%` meant would be a
 * second answer to the question. Only what was typed is sent, so a limit left
 * empty is left as it is rather than cleared.
 *
 * Lifting the limits for a while is the same request, naming how many minutes.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import { linesTyped } from "./upkeep";
import type { Requested, Sharing } from "./work";

/** Every request the line panel makes. */
export const everySharing: readonly Sharing[] = ["bandwidth"];

/** Whether a record is of something the line panel asked for. */
export function isSharing(doing: Requested): doing is Sharing {
  const sharing: readonly Requested[] = everySharing;
  return sharing.includes(doing);
}

/** What happens when a declared cap is reached. */
export type Exceeded = "pause" | "throttle" | "continue";

/** Every answer to what happens when a cap is reached, in the order offered. */
export const everyExceeded: readonly Exceeded[] = [
  "pause",
  "throttle",
  "continue",
];

/** What a value names for when a cap is reached, or the one given where it names none. */
export function exceededChosen(value: string, fallback: Exceeded): Exceeded {
  return everyExceeded.find((one) => one === value) ?? fallback;
}

/** What a declaration names, each as it was typed. */
export interface Declared {
  /** How much of the line downloads may take. */
  readonly down?: string;
  /** How much of it uploads may take. */
  readonly up?: string;
  /** The hours the household is awake, as `HH:MM-HH:MM`. */
  readonly active?: string;
  /** What the line carries, as `<down>/<up>`. */
  readonly line?: string;
  /** A monthly allowance for what the stack itself moves. */
  readonly cap?: string;
  /** What happens when the cap is reached. */
  readonly exceeded?: Exceeded;
}

/** One asking, with whatever it names. */
export type Declare =
  /** Limits declared, as typed. */
  | { readonly doing: "bandwidth"; readonly declared: Declared }
  /** The limits lifted for this many minutes. */
  | { readonly doing: "bandwidth"; readonly minutes: number };

/** The fields a declaration can name as typed, in the order they are shown. */
export const everyTyped = ["down", "up", "active", "line", "cap"] as const;

/** The fields a declaration can name, each as it was typed. */
export type Typed = Readonly<Record<(typeof everyTyped)[number], string>>;

/**
 * A declaration as typed, or nothing where nothing was typed.
 *
 * Every field is trimmed, and one left empty is left out. What happens when a
 * cap is reached goes only with a cap.
 */
export function declarationTyped(
  typed: Typed,
  exceeded: Exceeded,
): Declared | undefined {
  let declared: Declared = {};
  for (const field of everyTyped) {
    const value = typed[field].trim();
    if (value !== "") declared = { ...declared, [field]: value };
  }
  if (Object.keys(declared).length === 0) return undefined;
  return declared.cap === undefined ? declared : { ...declared, exceeded };
}

/** A number of minutes as typed, or nothing where it is not a whole one. */
export const minutesTyped = linesTyped;

/** What to send for one asking. */
export function givenForDeclare(declare: Declare): Arguments {
  return "minutes" in declare
    ? { unrestricted_for: declare.minutes }
    : { ...declare.declared };
}

/** How the line panel's requests are asked for. */
export const sharing: Family<Declare> = {
  owns: isSharing,
  question: () => undefined,
  given: givenForDeclare,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed how the line is shared, which is
 * what the line panel draws.
 */
export function changedTheLine(came: Came): boolean {
  return came.kind === "bandwidth" && came.report.applied;
}

/**
 * Everything the line panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Sharer = Asker<Declare>;
