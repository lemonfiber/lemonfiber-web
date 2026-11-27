/**
 * What running a run-and-exit service at once came to, or would come to.
 *
 * A rehearsal runs nothing and says whether a run would go, or what holds it
 * back, in lemonfiber's own words. A run says how it ended, and how many of the
 * service's times came while it was still going.
 *
 * The words live in `messages/`. What holds a run back is lemonfiber's sentence
 * and is passed through unchanged.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./instant";
import * as m from "../paraglide/messages.js";

/** What one run, or one rehearsal of it, came to. */
export type Ran = ByKind["ran"]["data"];

/** How the run went, where one went. */
function endedLine(ran: NonNullable<Ran["ran"]>): string {
  const when = whenOf(ran.ended);
  const exit = ran.exit ?? undefined;
  return exit === undefined
    ? m.came_ran_unexited({ when })
    : m.came_ran_ended({ when, exit });
}

/** What a run, or its rehearsal, came to, a sentence at a time. */
export function ranLines(report: Ran): readonly string[] {
  const lines: string[] = report.rehearsed ? [m.came_rehearsed()] : [];
  const held = report.held ?? undefined;
  if (held !== undefined) return [...lines, held];
  if (!report.due) return [...lines, m.came_ran_not_due()];
  const ran = report.ran ?? undefined;
  if (ran === undefined) {
    return [
      ...lines,
      report.rehearsed ? m.came_ran_would() : m.came_ran_none(),
    ];
  }
  lines.push(endedLine(ran));
  if (report.skipped > 0) {
    lines.push(m.came_ran_skipped({ count: report.skipped }));
  }
  return lines;
}
