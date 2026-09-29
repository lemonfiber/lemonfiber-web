/**
 * How the line is shared between the household and the stack, in lines a
 * reader and a record can carry.
 *
 * lemonfiber answers with where the line stands, what that means for the
 * household, each limit and the line it was weighed against, and what each
 * download client was asked and is doing about it. The sentences it writes are
 * its own and are passed through unchanged; the words for where the line
 * stands and for what each client did live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { bytes } from "./figures";
import * as m from "../paraglide/messages.js";

/** How the line is shared, as a reading or a declaration answers. */
export type Shared = ByKind["bandwidth"]["data"];

/** Where the line stands, in one word the report names. */
export type Restraint = Shared["restraint"];

/** One download client, and how it answered about its limits. */
type Holding = Shared["clients"][number];

/** Where a month stands against a declared cap. */
type Reached = NonNullable<Shared["reached"]>;

/** Where the month stands against the cap, in words. */
function wordOfReached(reached: Reached | null | undefined): string {
  switch (reached) {
    case "within":
      return m.line_reached_within();
    case "warning":
      return m.line_reached_warning();
    case "exceeded":
      return m.line_reached_exceeded();
    case null:
    case undefined:
      return m.line_reached_unread();
    default:
      return m.line_reached_unrecognised();
  }
}

/** What became of one limit, in one direction, on one client. */
type Verdict = Extract<
  Holding["answer"],
  { answered: "held" }
>["down"]["verdict"];

/** Where the line stands, in the words a reader is given. */
export function wordOfRestraint(restraint: Restraint): string {
  switch (restraint) {
    case "unlimited":
      return m.line_unlimited();
    case "limited":
      return m.line_limited();
    case "scheduled-active":
      return m.line_scheduled_active();
    case "scheduled-quiet":
      return m.line_scheduled_quiet();
    case "overridden":
      return m.line_overridden();
    case "cap-warning":
      return m.line_cap_warning();
    case "cap-exceeded":
      return m.line_cap_exceeded();
    default:
      return m.line_unrecognised();
  }
}

/** What became of one limit on one client, in a few words. */
function wordOfVerdict(verdict: Verdict): string {
  switch (verdict) {
    case "unasked":
      return m.line_verdict_unasked();
    case "nothing-to-limit":
      return m.line_verdict_nothing();
    case "holding":
      return m.line_verdict_holding();
    case "ignored":
      return m.line_verdict_ignored();
    case "overrunning":
      return m.line_verdict_overrunning();
    default:
      return m.line_verdict_unrecognised();
  }
}

/** What one download client did about the limits on it, in one line. */
export function clientLine(holding: Holding): string {
  const { answer, client } = holding;
  if (answer.answered === "silent") {
    return m.line_client_silent({ client, said: answer.said });
  }
  return m.line_client_held({
    client,
    down: wordOfVerdict(answer.down.verdict),
    up: wordOfVerdict(answer.up.verdict),
  });
}

/**
 * How the line is shared, line by line: what it means, each limit, what it
 * costs and what is lifting or spending it, what is worth knowing before
 * trusting the reading, and what each client did.
 */
export function lineLines(report: Shared): readonly string[] {
  const lines: string[] = [
    wordOfRestraint(report.restraint),
    report.means,
    report.down.says,
    report.up.says,
  ];
  for (const said of [report.ratio, report.respite_says, report.acting]) {
    if (said !== undefined && said !== null) lines.push(said);
  }
  const { cap, metered } = report;
  if (cap !== undefined && cap !== null) {
    lines.push(
      m.line_cap_standing({
        cap: bytes(cap.monthly),
        standing: wordOfReached(report.reached),
      }),
    );
  }
  if (metered !== undefined && metered !== null) {
    lines.push(
      m.line_metered({
        month: metered.month,
        down: bytes(metered.down),
        up: bytes(metered.up),
      }),
      metered.excludes,
      ...metered.incomplete,
    );
  }
  lines.push(...report.cautions, ...report.clients.map(clientLine));
  return lines;
}
