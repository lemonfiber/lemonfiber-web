/**
 * What the dashboard's suites draw it from: the screen with nothing yet, the
 * freshness and the reading it is handed, and the stream's moment with one part
 * of it replaced.
 */
import { render } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import Dashboard from "./Dashboard.svelte";
import { moment, stack, controls } from "./fixture";
import type { Freshness } from "../lib/freshness";
import type { Moment, Stack } from "../lib/wire";

export const never: Freshness = { kind: "never" };
export const answered: Freshness = { kind: "answered", secondsAgo: 4 };
export const read: Reading<Stack> = { ok: true, value: stack };

/** The screen with nothing yet, and whatever this test hands it instead. */
export function board(
  over: Partial<Parameters<typeof Dashboard>[1]> = {},
): void {
  render(Dashboard, {
    stack: undefined,
    programs: undefined,
    moment: undefined,
    flow: "opening",
    read: never,
    live: never,
    controls,
    ...over,
  });
}

/** The stream's moment, with one part of it replaced. */
export const changed = (over: Partial<Moment>): Moment => ({
  ...moment,
  ...over,
});
