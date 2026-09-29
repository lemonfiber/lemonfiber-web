/**
 * Where the stack stands against the versions this build pins, and what moving
 * onto them would change or changed, in lines a record can carry.
 *
 * Unconfirmed, an update changes nothing and answers with each step it would
 * take: the version a service stands on, the one pinned for it, how large the
 * step is, whether anything walks it back, and what it means. Confirmed, it
 * answers with how each service it reached ended, and how each could be put
 * back.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Where the stack stands against its pins, and what moving would come to. */
export type Updated = ByKind["update"]["data"];

/** One step an update would take. */
export type Step = Updated["changes"][number];

/** How one service's update ended. */
type Applied = Updated["applied"][number];

/** Where the stack stands against the versions this build pins, in words. */
function wordOfState(state: Updated["state"]): string {
  switch (state) {
    case "current":
      return m.came_update_current();
    case "updates-available":
      return m.came_update_available();
    case "updated":
      return m.came_update_updated();
    case "partial":
      return m.came_update_partial();
    case "failed":
      return m.came_update_failed();
    default:
      return m.came_update_unrecognised();
  }
}

/** How large a step is, in words. */
function wordOfJump(jump: Step["jump"]): string {
  switch (jump) {
    case "major":
      return m.came_update_major();
    case "minor":
      return m.came_update_minor();
    case "patch":
      return m.came_update_patch();
    case "untellable":
      return m.came_update_untellable();
    default:
      return m.came_update_untellable();
  }
}

/** One step an update would take, in one line. */
export function stepLine(step: Step): string {
  const said = {
    service: step.service,
    from: step.current,
    to: step.target,
    jump: wordOfJump(step.jump),
    because: step.because,
  };
  if (step.refused) return m.came_update_refused(said);
  return step.irreversible
    ? m.came_update_one_way(said)
    : m.came_update_step(said);
}

/** How one service's update ended, in words. */
function endingWords(applied: Applied): string {
  const said = { service: applied.service, from: applied.from, to: applied.to };
  switch (applied.ending) {
    case "updated":
      return m.came_update_ended_updated(said);
    case "not-fetched":
      return m.came_update_ended_unfetched(said);
    case "not-started":
      return m.came_update_ended_unstarted(said);
    case "not-reached":
      return m.came_update_ended_unreached(said);
    default:
      return m.came_update_ended_other(said);
  }
}

/**
 * How one service could be put back, given how it ended. Pinning the previous
 * version again is a minute's work and restoring the backup is an evening, so
 * which one is said rather than left to be worked out.
 */
function reversalWords(applied: Applied): string {
  switch (applied.reversal) {
    case "rollback":
      return m.came_update_rollback({ service: applied.service });
    case "restore":
      return m.came_update_restore({ service: applied.service });
    default:
      return m.came_update_reversal_other({ service: applied.service });
  }
}

/** What an update would change, or what it changed, line by line. */
export function updateLines(report: Updated): readonly string[] {
  const lines: string[] = [wordOfState(report.state)];
  if (!report.confirmed) lines.push(...report.changes.map(stepLine));
  for (const applied of report.applied) {
    lines.push(endingWords(applied), reversalWords(applied));
    if (applied.detail !== undefined && applied.detail !== null) {
      lines.push(applied.detail);
    }
  }
  if (report.in_flight.length > 0) {
    lines.push(m.came_update_in_flight({ names: report.in_flight.join(", ") }));
  }
  for (const edit of report.stack_edits) {
    lines.push(m.came_edited({ path: edit.path }));
  }
  for (const said of [report.backup, report.halted]) {
    if (said !== undefined && said !== null) lines.push(said);
  }
  return lines;
}
