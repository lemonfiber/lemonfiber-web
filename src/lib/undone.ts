/**
 * What putting a run of changes back came to, in lines a reader can carry:
 * what went back and what putting it back did, what did not and why, and what
 * going back means beyond the change itself.
 *
 * The words around what lemonfiber says live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What putting back a run of changes came to. */
export type Undone = ByKind["undo"]["data"];

/** One change put back, and what putting it back did. */
type Reversal = Undone["reversed"][number]["action"]["does"];

/** What putting one change back did, in a few words. */
function reversalWords(does: Reversal): string {
  switch (does) {
    case "remove":
      return m.came_undo_remove();
    case "restore":
      return m.came_undo_restore();
    case "delete":
      return m.came_undo_delete();
    case "withdraw":
      return m.came_undo_withdraw();
    case "repin":
      return m.came_undo_repin();
    case "reconfigure":
      return m.came_undo_reconfigure();
    case "rewind":
      return m.came_undo_rewind();
    case "revoke":
      return m.came_undo_revoke();
    case "reinstate":
      return m.came_undo_reinstate();
    default:
      return m.came_undo_other();
  }
}

/** What putting a run of changes back came to, line by line. */
export function undoLines(report: Undone): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  for (const one of report.reversed) {
    lines.push(
      m.came_undo_reversed({
        target: one.target,
        does: reversalWords(one.action.does),
      }),
    );
  }
  for (const one of report.left) {
    lines.push(m.came_undo_left({ target: one.target, because: one.because }));
  }
  for (const one of report.noted ?? []) {
    lines.push(m.came_undo_noted({ target: one.target, because: one.because }));
  }
  if (lines.length === 0) lines.push(m.came_undo_nothing());
  return lines;
}
