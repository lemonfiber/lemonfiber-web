/**
 * When a source last answered, and the words shown for it.
 *
 * Every panel carries its own. One source falling silent makes that panel's
 * figures untrustworthy and nothing else's, so freshness belongs to the panel
 * rather than to the screen.
 */
import * as m from "../paraglide/messages.js";
import type { State } from "./state";

const A_SECOND = 1000;
const A_MINUTE = 60;
const AN_HOUR = 3600;

/**
 * A source that answered, one that has stopped answering, and one that never
 * has are three different things.
 */
export type Freshness =
  | { readonly kind: "answered"; readonly secondsAgo: number }
  | { readonly kind: "silent"; readonly secondsAgo: number }
  | { readonly kind: "never" };

/**
 * How long ago, in the largest whole unit that still says something.
 *
 * Rounds down, and floors at nothing: a span is never allowed to claim more
 * time has passed than has, and a clock that disagrees with the source's is a
 * reason to say "just now" rather than to say something impossible.
 */
export function spanFor(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  if (whole < A_MINUTE) return m.span_seconds({ count: whole });
  if (whole < AN_HOUR)
    return m.span_minutes({ count: Math.floor(whole / A_MINUTE) });
  return m.span_hours({ count: Math.floor(whole / AN_HOUR) });
}

/**
 * How long ago a source answered, read against the clock.
 *
 * A stamp is a span rather than a moment, and a span written down when the
 * source answered says "just now" for as long as the screen is open. So what a
 * screen holds is when the source answered, and the span is worked out each time
 * the clock moves.
 */
export function answeredAt(at: number, now: number): Freshness {
  return { kind: "answered", secondsAgo: (now - at) / A_SECOND };
}

/**
 * How long a source has been silent, from the last moment it was not.
 */
export function silentSince(at: number, now: number): Freshness {
  return { kind: "silent", secondsAgo: (now - at) / A_SECOND };
}

/**
 * The trust the stamp's mark shows.
 *
 * A source that has gone silent is `stopped` rather than `quiet`: `quiet`
 * means a figure is still on screen and is the last one given, and a panel
 * whose source is unreachable is showing no figures at all.
 */
export function stateFor(freshness: Freshness): State {
  switch (freshness.kind) {
    case "answered":
      return "known";
    case "silent":
      return "stopped";
    case "never":
      return "unknown";
  }
}

/**
 * The words on the stamp.
 */
export function stampFor(freshness: Freshness): string {
  switch (freshness.kind) {
    case "answered":
      return m.fresh_answered({ span: spanFor(freshness.secondsAgo) });
    case "silent":
      return m.fresh_silent({ span: spanFor(freshness.secondsAgo) });
    case "never":
      return m.fresh_never();
  }
}
