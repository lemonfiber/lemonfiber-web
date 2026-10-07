/**
 * What an action came to, as lemonfiber reported it, in lines a record can carry.
 *
 * A job that finished is redeemed for the envelope the equivalent command
 * renders, and that envelope is the outcome: what ran, what it left running,
 * and what it could not do. A record that said only "finished" would be asking
 * the operator to go and look for what the reply had already told them.
 *
 * A start, stop, switch, restart or fetch answers with what Compose ran and
 * what the services ended up doing; wiring the programs to each other, and
 * keeping the operator's own edits, answer with every connection attempted and
 * how each turned out. The checks answer with a run of them; a repair with what
 * it would do, or what it did; putting a repair back with what went back and
 * what did not. A backup, a restore and a support bundle are read in `./kept`,
 * the quality choice and fetching the library again in `./tuned`, a
 * setting changed in `./configured`, an account offered or the household as
 * an act on it left it in `./invited`, pairing material in `./paired`, how the
 * line is shared in `./shared`, pausing or resuming every download in
 * `./paused`, moving onto this build's pins in
 * `./updated`, where one item is, a walk through and a guard in
 * `./traced`, what this machine keeps running, what lemonfiber keeps and
 * taking it off the machine in `./removed`, letting a download go in
 * `./letting`, and taking back the room that costs nothing in `./reclaimed`.
 * Anything else arrives as an outcome nobody here reads, which is said rather
 * than drawn as nothing.
 *
 * The sentences lemonfiber writes into a report are its own and are passed
 * through unchanged. The words around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import {
  backupLines,
  bundleLines,
  restoreLines,
  type Backed,
  type Bundled,
  type Restored,
} from "./kept";
import { qualityLines, upgradeLines, type Tuned, type Upgraded } from "./tuned";
import { configLines, type Configured } from "./configured";
import { pairingLines, type Paired } from "./paired";
import { lineLines, type Shared } from "./shared";
import { pausingLines, type Paused } from "./paused";
import {
  guardLines,
  traceLines,
  walkthroughLines,
  type Guarded,
  type Traced,
  type Walked,
} from "./traced";
import { updateLines, type Updated } from "./updated";
import {
  hostingLines,
  storedLines,
  uninstallLines,
  type Hosted,
  type Stored,
  type Uninstalled,
} from "./removed";
import { lettingLines, type Let, type Reckoned } from "./letting";
import { reclaimedLines } from "./reclaimed";
import {
  householdLines,
  invitationLines,
  type Housed,
  type Invited,
} from "./invited";
import { gradingOf } from "./verdict";
import * as m from "../paraglide/messages.js";

/** What a start, stop, switch, restart or fetch came to. */
export type Lifecycle = ByKind["lifecycle"]["data"];

/** What wiring the programs to each other came to. */
export type Seeded = ByKind["seed"]["data"];

/** One connection a wiring pass attempted, and how it turned out. */
type Wired = Seeded["wirings"][number];

/** How one connection turned out, as the report names it. */
type WiredAs = Wired["state"]["state"];

/** What a run of the checks found. */
export type Checked = ByKind["doctor"]["data"];

/** What could be put right, or what putting it right came to. */
export type Repaired = ByKind["repair"]["data"];

/** One repair an offer holds: what it would do, and what else it changes. */
export type Offered = Repaired["offered"][number];

/** One repair carried out, and how the check read afterwards. */
type Mended = Repaired["mended"][number];

/** What putting back a run of changes came to. */
export type Undone = ByKind["undo"]["data"];

/** One change put back, and what putting it back did. */
type Reversal = Undone["reversed"][number]["action"]["does"];

/** What one piece of finished work came to, as far as this page reads it. */
export type Came =
  | { readonly kind: "lifecycle"; readonly report: Lifecycle }
  | { readonly kind: "seed"; readonly report: Seeded }
  | { readonly kind: "doctor"; readonly report: Checked }
  | { readonly kind: "repair"; readonly report: Repaired }
  | { readonly kind: "undo"; readonly report: Undone }
  | { readonly kind: "backup"; readonly report: Backed }
  | { readonly kind: "restore"; readonly report: Restored }
  | { readonly kind: "bundle"; readonly report: Bundled }
  | { readonly kind: "quality"; readonly report: Tuned }
  | { readonly kind: "upgrade"; readonly report: Upgraded }
  | { readonly kind: "config"; readonly report: Configured }
  | { readonly kind: "invitation"; readonly report: Invited }
  | { readonly kind: "household"; readonly report: Housed }
  | { readonly kind: "pairing"; readonly report: Paired }
  | { readonly kind: "bandwidth"; readonly report: Shared }
  | { readonly kind: "pausing"; readonly report: Paused }
  | { readonly kind: "update"; readonly report: Updated }
  | { readonly kind: "trace"; readonly report: Traced }
  | { readonly kind: "walkthrough"; readonly report: Walked }
  | { readonly kind: "watch"; readonly report: Guarded }
  | { readonly kind: "hosting"; readonly report: Hosted }
  | { readonly kind: "stored"; readonly report: Stored }
  | { readonly kind: "uninstall"; readonly report: Uninstalled }
  | { readonly kind: "stop-seeding"; readonly report: Let }
  | { readonly kind: "space"; readonly report: Reckoned }
  | { readonly kind: "unread" };

/** A service still doing what the action asked of it. */
const STILL_STARTING = new Set<string>(["starting"]);

/** A service doing what it is for. */
const UP = new Set<string>(["running", "healthy", "host-managed"]);

/** Names, as a reader is given a list of them. */
function listed(names: readonly string[]): string {
  return names.join(", ");
}

/** What a start, stop, switch, restart or fetch left behind, line by line. */
function lifecycleLines(report: Lifecycle): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  if (report.held !== undefined && report.held !== null) {
    lines.push(report.held);
  }
  if (
    report.status !== undefined &&
    report.status !== null &&
    report.status !== 0
  ) {
    lines.push(m.came_exit({ status: String(report.status) }));
  }
  if (report.condition !== undefined && report.condition !== null) {
    lines.push(conditionWord(report.condition));
  }
  lines.push(...switchedLines(report.switched));

  const down = report.services
    .filter((one) => !UP.has(one.state) && !STILL_STARTING.has(one.state))
    .map((one) => one.name);
  if (down.length > 0) lines.push(m.came_not_up({ names: listed(down) }));
  const starting = report.services
    .filter((one) => STILL_STARTING.has(one.state))
    .map((one) => one.name);
  if (starting.length > 0) {
    lines.push(m.came_still_starting({ names: listed(starting) }));
  }

  for (const conflict of report.port_conflicts ?? []) {
    lines.push(
      m.came_port_held({
        port: String(conflict.port),
        holder: conflict.held_by,
        wanter: conflict.wanted_by,
      }),
    );
  }
  if (report.forwarding !== undefined && report.forwarding !== null) {
    lines.push(report.forwarding);
  }
  for (const edit of report.stack_edits) {
    lines.push(m.came_edited({ path: edit.path }));
  }
  lines.push(m.came_command({ command: report.command.join(" ") }));
  return lines;
}

/** What one word of how the services stand says. */
function conditionWord(condition: NonNullable<Lifecycle["condition"]>): string {
  switch (condition) {
    case "active":
      return m.came_condition_active();
    case "partial":
      return m.came_condition_partial();
    case "degraded":
      return m.came_condition_degraded();
    case "inactive":
      return m.came_condition_inactive();
    default:
      return m.came_condition_unknown();
  }
}

/** What narrowing to the forms chosen started, stopped and left alone. */
function switchedLines(switched: Lifecycle["switched"]): readonly string[] {
  if (switched === undefined || switched === null) return [];
  const lines: string[] = [];
  if (switched.started.length > 0) {
    lines.push(m.came_started({ names: listed(switched.started) }));
  }
  if (switched.stopped.length > 0) {
    lines.push(m.came_stopped({ names: listed(switched.stopped) }));
  }
  if (switched.kept.length > 0) {
    lines.push(m.came_kept({ names: listed(switched.kept) }));
  }
  return lines;
}

/** A way a connection can turn out that carries nothing but its name. */
type Bare = Exclude<
  WiredAs,
  "conflicted" | "observed" | "skipped" | "failed" | "refused" | "unmatched"
>;

/**
 * Every way a connection can turn out that carries nothing but its name, in the
 * order they are worth reading. Each is said of every connection that turned out
 * that way at once.
 */
const everyBare: readonly Bare[] = [
  "drifted",
  "stale",
  "wired",
  "would-wire",
  "would-adopt",
  "adopted",
  "already-wired",
  "unmanaged",
];

/** What a connection turning out one way is called, above the connections. */
function bareWords(state: Bare, connections: string): string {
  switch (state) {
    case "drifted":
      return m.came_wiring_drifted({ connections });
    case "stale":
      return m.came_wiring_stale({ connections });
    case "wired":
      return m.came_wiring_wired({ connections });
    case "would-wire":
      return m.came_wiring_would({ connections });
    case "would-adopt":
      return m.came_wiring_would_adopt({ connections });
    case "adopted":
      return m.came_wiring_adopted({ connections });
    case "already-wired":
      return m.came_wiring_already({ connections });
    case "unmanaged":
      return m.came_wiring_unmanaged({ connections });
  }
}

/**
 * What one connection that carries words of its own came to, or nothing where
 * it carries none. The words are lemonfiber's, or the service's, as given.
 */
function ownLine(wiring: Wired): string | undefined {
  const { connection, state } = wiring;
  switch (state.state) {
    case "conflicted":
      return m.came_wiring_conflicted({
        connection,
        yours: state.yours ?? m.came_value_cleared(),
        ours: state.ours,
      });
    case "observed":
      return m.came_wiring_observed({ connection, reason: state.reason });
    case "skipped":
      return m.came_wiring_skipped({ connection, reason: state.reason });
    case "failed":
      return m.came_wiring_failed({ connection, detail: state.detail });
    case "refused":
      return m.came_wiring_refused({ connection, reason: state.reason });
    case "unmatched":
      return m.came_wiring_unmatched({ connection, reason: state.reason });
    case "drifted":
    case "stale":
    case "wired":
    case "would-wire":
    case "would-adopt":
    case "adopted":
    case "already-wired":
    case "unmanaged":
      return undefined;
    default:
      return undefined;
  }
}

/** Whether a connection turned out in a way this page has words for. */
function known(wiring: Wired): boolean {
  const said: readonly string[] = everyBare;
  return said.includes(wiring.state.state) || ownLine(wiring) !== undefined;
}

/** What a wiring pass did, line by line. */
function seedLines(report: Seeded): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  if (report.assessment === "unassessable") {
    lines.push(m.came_unassessable());
  }
  for (const wiring of report.wirings) {
    if (wiring.severity.severity === "warning") {
      lines.push(
        m.came_wiring_broken({
          connection: wiring.connection,
          breakage: wiring.severity.breakage,
          remediation: wiring.severity.remediation,
        }),
      );
    }
    const own = ownLine(wiring);
    if (own !== undefined) lines.push(own);
  }
  for (const state of everyBare) {
    const connections = report.wirings
      .filter((wiring) => wiring.state.state === state)
      .map((wiring) => wiring.connection);
    if (connections.length > 0) {
      lines.push(bareWords(state, listed(connections)));
    }
  }
  const others = report.wirings
    .filter((wiring) => !known(wiring))
    .map((wiring) => wiring.connection);
  if (others.length > 0) {
    lines.push(m.came_wiring_other({ connections: listed(others) }));
  }
  for (const skipped of report.unsupported ?? []) {
    lines.push(
      m.came_unsupported({ what: skipped.what, because: skipped.because }),
    );
  }
  return lines;
}

/** What one repair carried out came to, once the check was asked again. */
function mendedLine(one: Mended): string {
  const check = one.repair.check;
  switch (one.outcome.outcome) {
    case "fixed":
      return m.came_repair_fixed({ check });
    case "fix_failed":
      return m.came_repair_fix_failed({ check });
    case "stopped":
      return m.came_repair_stopped({ check, leaving: one.outcome.leaving });
    case "declined":
      return m.came_repair_declined({ check });
    case "would_overwrite":
      return m.came_repair_would_overwrite({ check });
    case "unmanaged":
      return m.came_repair_unmanaged({ check });
    default:
      return m.came_repair_unknown({ check });
  }
}

/**
 * What an offer holds, or what agreeing to one came to, line by line.
 *
 * An offer is what was read before agreeing, so each repair in it is said with
 * what it would do. What was carried out is said with how the check read once
 * it was asked again, and what has been tried too often is said with what is
 * left to the operator.
 */
function repairLines(report: Repaired): readonly string[] {
  const lines: string[] = [];
  if (!report.acted) {
    for (const one of report.offered) {
      lines.push(m.came_repair_offered({ check: one.check, does: one.does }));
    }
  }
  for (const one of report.mended) lines.push(mendedLine(one));
  for (const one of report.beyond) {
    lines.push(
      m.came_repair_beyond({ check: one.check, action: one.remedy.action }),
    );
  }
  if (lines.length === 0) lines.push(m.came_repair_nothing());
  return lines;
}

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
function undoLines(report: Undone): readonly string[] {
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

/**
 * What a record of finished work says it came to, line by line.
 *
 * An outcome this page does not read says so in one line, so a record never
 * reads as though the work came to nothing.
 */
export function linesOf(came: Came): readonly string[] {
  switch (came.kind) {
    case "lifecycle":
      return lifecycleLines(came.report);
    case "seed":
      return seedLines(came.report);
    case "doctor":
      return [gradingOf(came.report.overall).lead, m.came_checks_shown()];
    case "repair":
      return repairLines(came.report);
    case "undo":
      return undoLines(came.report);
    case "backup":
      return backupLines(came.report);
    case "restore":
      return restoreLines(came.report);
    case "bundle":
      return bundleLines(came.report);
    case "quality":
      return qualityLines(came.report);
    case "upgrade":
      return upgradeLines(came.report);
    case "config":
      return configLines(came.report);
    case "invitation":
      return invitationLines(came.report);
    case "household":
      return householdLines(came.report);
    case "pairing":
      return pairingLines(came.report);
    case "bandwidth":
      return lineLines(came.report);
    case "pausing":
      return pausingLines(came.report);
    case "update":
      return updateLines(came.report);
    case "trace":
      return traceLines(came.report);
    case "walkthrough":
      return walkthroughLines(came.report);
    case "watch":
      return guardLines(came.report);
    case "hosting":
      return hostingLines(came.report);
    case "stored":
      return storedLines(came.report);
    case "uninstall":
      return uninstallLines(came.report);
    case "stop-seeding":
      return lettingLines(came.report);
    case "space":
      return reclaimedLines(came.report);
    case "unread":
      return [m.came_unread()];
  }
}
