/**
 * A reading told as lines a person can carry: what it says as a whole, then
 * each thing it lists under a heading of its own.
 *
 * The health panels each read a different shape and draw the same thing, so
 * each shape is turned into this one and a single panel draws them all.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import type { Sought } from "./finding";
import { AN_HOUR, A_MINUTE } from "./instant";
import * as m from "../paraglide/messages.js";

/** Following one listed thing to where it is. */
export interface Following {
  /** The words on the control. */
  readonly label: string;
  /** What looking it up asks for. */
  readonly sought: Sought;
}

/** One thing a reading lists. */
export interface Entry {
  /** What it is. */
  readonly head: string;
  /** What is said of it, in order. */
  readonly lines: readonly string[];
  /** Where it can be followed to, where it can. */
  readonly follow?: Following | undefined;
}

/** A reading, told. */
export interface Readout {
  /** What it says as a whole, in order. */
  readonly lines: readonly string[];
  /** Each thing it lists. */
  readonly entries: readonly Entry[];
}

/** A value lemonfiber may leave out, kept where it gave one. */
export function given<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

/** A reading told by `telling`, or why it could not be read. */
export function toldBy<T>(
  reading: Reading<T> | undefined,
  telling: (value: T) => Readout,
): Reading<Readout> | undefined {
  if (reading === undefined) return undefined;
  return reading.ok ? { ok: true, value: telling(reading.value) } : reading;
}

/** A length of time given in seconds, in its largest whole unit. */
export function lasting(seconds: number): string {
  if (seconds > 0 && seconds % AN_HOUR === 0) {
    return m.lasting_hours({ count: seconds / AN_HOUR });
  }
  if (seconds > 0 && seconds % A_MINUTE === 0) {
    return m.lasting_minutes({ count: seconds / A_MINUTE });
  }
  return m.lasting_seconds({ count: seconds });
}
