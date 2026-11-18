/**
 * The services that run and exit on a schedule, as their runs left them.
 *
 * Each is kept apart from the services kept running: it has a container only
 * while a run of it is going, so its standing is how its last run ended. The
 * last lines a failed run wrote reach the operator alone, with every credential
 * in them already withheld by the core.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import { whenOf } from "./instant";
import type { State } from "./state";
import type { Moment } from "./wire";
import * as m from "../paraglide/messages.js";

/** One run-and-exit service. */
export type Scheduled = Moment["scheduled"][number];

/** How far one run-and-exit service can be trusted to be doing its job. */
export function stateOfScheduled(scheduled: Scheduled): State {
  if (scheduled.running) return "part";
  switch (scheduled.health) {
    case "succeeded":
      return "known";
    case "failed":
      return "stopped";
    case "not-run":
      return "quiet";
    default:
      return "unknown";
  }
}

/** Where one run-and-exit service stands, in a word or two. */
export function wordOfScheduled(scheduled: Scheduled): string {
  if (scheduled.running) return m.scheduled_running();
  switch (scheduled.health) {
    case "succeeded":
      return m.scheduled_succeeded();
    case "failed":
      return m.scheduled_failed();
    case "not-run":
      return m.scheduled_not_run();
    default:
      return m.scheduled_unrecognised();
  }
}

/** How the last run ended, where there was one, and its exit code where it gave one. */
function endedOf(
  last: Scheduled["last"] | undefined,
  exit: number | undefined,
): string {
  if (last === undefined || last === null) return m.scheduled_never_ran();
  if (exit === undefined)
    return m.scheduled_ended_unexited({ when: whenOf(last.ended) });
  return m.scheduled_ended({ when: whenOf(last.ended), exit });
}

/** How its last run ended, and what keeps it from running on time. */
export function saidOfScheduled(scheduled: Scheduled): string {
  const last = scheduled.last ?? undefined;
  const exit = last?.exit ?? undefined;
  const said = [endedOf(last, exit)];
  if (scheduled.skipped > 0)
    said.push(m.scheduled_skipped({ count: scheduled.skipped }));
  if (!scheduled.fired) said.push(m.scheduled_unfired());
  return said.join(" ");
}

/** The last lines a failed run wrote, or nothing where it did not fail. */
export function linesOfScheduled(
  scheduled: Scheduled,
): readonly string[] | undefined {
  const log = scheduled.last?.log ?? [];
  return scheduled.health === "failed" && log.length > 0 ? log : undefined;
}
