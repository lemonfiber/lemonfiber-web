/**
 * The steps a setup runs through, and where each of them stands.
 *
 * A rail says three things at once: what is behind you, what you are on, and
 * what is still to come. Collapsing `now` into either of the others leaves a
 * rail that cannot answer the one question it is there for.
 */

/**
 * One step of a setup.
 */
export interface Step {
  /** What the step is called. */
  title: string;
  /** What it settled, or what it will ask for. */
  detail: string;
}

/**
 * `done` is behind you, `now` is the one being done, `later` is still to come.
 */
export type Standing = "done" | "now" | "later";

/**
 * Every standing there is, in the order a step passes through them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyStanding: readonly Standing[] = ["done", "now", "later"];

/**
 * Where a step stands, given which step of the run is being done.
 *
 * Both counts start at one, as the rail draws them. A run has exactly one
 * `now` because this is what decides it, rather than each step being told.
 */
export function standingAt(position: number, current: number): Standing {
  if (position < current) return "done";
  if (position === current) return "now";
  return "later";
}
