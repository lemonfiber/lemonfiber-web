/**
 * What an act on a setup already here came to, or would come to, in lines a
 * reader can carry.
 *
 * Four acts. Adopting has lemonfiber manage the project as it stands, naming
 * the paths to back up first and every database a newer version would
 * upgrade. Standing beside it moves lemonfiber's services onto other ports.
 * Importing copies the operator's own records across, naming what it cannot.
 * Replacing stops the project and stands in its place, naming every service it
 * would stop before it does; it is never said to be done while anything it
 * replaces is still running.
 *
 * Each says where it stands: still to be agreed to, refused with lemonfiber's
 * reason, done, or left as it was.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import type { Moving } from "./requested";
import { carryingLines } from "./survey";
import * as m from "../paraglide/messages.js";

/** What adopting came to. */
export type Adopted = ByKind["adoption"]["data"];

/** What standing beside came to. */
export type Beside = ByKind["beside"]["data"];

/** What importing came to. */
export type Imported = ByKind["import"]["data"];

/** What replacing came to. */
export type Replaced = ByKind["replacement"]["data"];

/** Where an act stands. */
export type Stance = Adopted["stance"];

/** One record carried across, or that would be. */
type Record = Imported["carried"][number];

/** Where an act stands, in a sentence, with lemonfiber's reason where it refused. */
export function stanceLine(
  stance: Stance,
  refusal: string | null | undefined,
): string {
  switch (stance) {
    case "pending":
      return m.move_pending();
    case "applied":
      return m.move_applied();
    case "unchanged":
      return m.move_unchanged();
    case "blocked":
      return refusal === undefined || refusal === null || refusal === ""
        ? m.move_blocked()
        : refusal;
    default:
      return m.move_stance_other();
  }
}

/** A value lemonfiber may leave out, kept where it says something. */
function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}

/** What adopting came to, line by line. */
export function adoptedLines(report: Adopted): readonly string[] {
  const lines = [stanceLine(report.stance, report.refusal)];
  if (said(report.project)) {
    lines.push(m.move_adopt_project({ project: report.project }));
  }
  if (report.back_up.length > 0) {
    lines.push(m.move_back_up({ paths: listed(report.back_up) }));
  }
  for (const one of report.upgrades) lines.push(...carryingLines(one));
  if (said(report.backed_up)) {
    lines.push(m.move_backed_up({ path: report.backed_up }));
  }
  return lines;
}

/** What standing beside came to, line by line. */
export function besideLines(report: Beside): readonly string[] {
  const lines = [stanceLine(report.stance, report.refusal)];
  for (const one of report.ports) {
    lines.push(
      m.survey_beside({ service: one.service, from: one.from, to: one.to }),
    );
  }
  if (said(report.written)) {
    lines.push(m.move_written({ path: report.written }));
  }
  return lines;
}

/** One record, in a line. */
function recordLine(record: Record): string {
  return m.move_record({
    kind: record.kind,
    name: record.name,
    service: record.service,
  });
}

/** What importing came to, line by line. */
export function importedLines(report: Imported): readonly string[] {
  const lines = [stanceLine(report.stance, report.refusal)];
  if (said(report.project)) {
    lines.push(m.move_import_project({ project: report.project }));
  }
  if (report.would_carry.length > 0) {
    lines.push(
      m.move_would_carry(),
      ...report.would_carry.map((one) => recordLine(one)),
    );
  }
  if (report.carried.length > 0) {
    lines.push(
      m.move_carried(),
      ...report.carried.map((one) => recordLine(one)),
    );
  }
  for (const one of report.not_carried) {
    lines.push(m.survey_named({ what: one.what, because: one.because }));
  }
  return lines;
}

/**
 * What replacing came to, line by line. Never said to be done while anything
 * it replaces is still running.
 */
export function replacedLines(report: Replaced): readonly string[] {
  const running = report.still_running;
  const lines = [
    report.stance === "applied" && running.length > 0
      ? m.move_not_done({ services: listed(running) })
      : stanceLine(report.stance, report.refusal),
  ];
  if (said(report.project)) {
    lines.push(m.move_replace_project({ project: report.project }));
  }
  if (report.would_stop.length > 0) {
    lines.push(m.move_would_stop({ services: listed(report.would_stop) }));
  }
  if (report.stopped.length > 0) {
    lines.push(m.move_stopped({ services: listed(report.stopped) }));
  }
  if (running.length > 0 && report.stance !== "applied") {
    lines.push(m.move_still_running({ services: listed(running) }));
  }
  return lines;
}

/** What one of the four acts came to, as a record carries it. */
export type Moved =
  | { readonly kind: "adoption"; readonly report: Adopted }
  | { readonly kind: "beside"; readonly report: Beside }
  | { readonly kind: "import"; readonly report: Imported }
  | { readonly kind: "replacement"; readonly report: Replaced };

/** What one of the four acts came to, line by line. */
export function movedLines(moved: Moved): readonly string[] {
  switch (moved.kind) {
    case "adoption":
      return adoptedLines(moved.report);
    case "beside":
      return besideLines(moved.report);
    case "import":
      return importedLines(moved.report);
    case "replacement":
      return replacedLines(moved.report);
  }
}

/** What a record of one of the four acts is headed. */
export function titleOfMove(doing: Moving): string {
  switch (doing) {
    case "migrate-adopt":
      return m.doing_migrate_adopt_title();
    case "migrate-import":
      return m.doing_migrate_import_title();
    case "migrate-beside":
      return m.doing_migrate_beside_title();
    case "migrate-replace":
      return m.doing_migrate_replace_title();
  }
}
