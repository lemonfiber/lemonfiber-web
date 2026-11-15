/**
 * Every instant lemonfiber hands over, in the reader's own calendar.
 *
 * lemonfiber writes an instant one way only: whole seconds since the Unix
 * epoch, as a number. This is the one place that number becomes a date a
 * reader is shown, so two screens naming the same moment name it alike.
 */
import type { Instant } from "@lemonfiber/sdk-ts/contract";
import { getLocale } from "../paraglide/runtime.js";

/** A second, in the milliseconds a clock counts. */
export const A_SECOND = 1000;

/** An instant, written in the reader's own language in the style given. */
function written(at: Instant, style: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLocale(), style).format(
    new Date(at * A_SECOND),
  );
}

/** The day and the time an instant names. */
export function whenOf(at: Instant): string {
  return written(at, { dateStyle: "long", timeStyle: "short" });
}

/** The day an instant falls on. */
export function dayOf(at: Instant): string {
  return written(at, { dateStyle: "long" });
}

/** An instant lemonfiber may leave out, kept where it carried one. */
export function stamped(at: Instant | null | undefined): at is Instant {
  return at !== undefined && at !== null;
}
