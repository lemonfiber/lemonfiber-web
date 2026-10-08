/**
 * Where one item is, walking one thing through end to end, and how a guard over
 * the data location ended, in lines a reader and a record can carry.
 *
 * A trace answers with how far the item got and each stage on the way, why
 * it stopped where it plainly has, how sure the trace is of the item it followed, where the services
 * disagree about it, and what happened to it. A walkthrough answers with what
 * it set out to prove, every line it said on the way, where it stopped and the
 * one thing to try, or what to do next. A guard answers with the forms it
 * stopped and why.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Where one item is in the pipeline. */
export type Traced = ByKind["trace"]["data"];

/** What walking one thing through came to. */
export type Walked = ByKind["walkthrough"]["data"];

/** How a guard over the data location ended. */
export type Guarded = ByKind["watch"]["data"];

/** A stage in an item's journey. */
type Stage = Traced["furthest"];

/** One stage an item reached, and the service that recorded it. */
type Passed = Traced["stages"][number];

/** One stage an item reached, with the service and, where known, the time. */
function stageLine(passed: Passed): string {
  const said = { stage: wordOfStage(passed.stage), service: passed.service };
  return passed.at === undefined || passed.at === null
    ? m.trace_stage(said)
    : m.trace_stage_at({ ...said, at: passed.at });
}

/** One notable thing that happened to an item. */
type Moment = Traced["history"][number];

/** A stage, in the words a reader is given. */
export function wordOfStage(stage: Stage): string {
  switch (stage) {
    case "not-monitored":
      return m.stage_not_monitored();
    case "monitored":
      return m.stage_monitored();
    case "searching":
      return m.stage_searching();
    case "found":
      return m.stage_found();
    case "grabbed":
      return m.stage_grabbed();
    case "downloading":
      return m.stage_downloading();
    case "downloaded":
      return m.stage_downloaded();
    case "importing":
      return m.stage_importing();
    case "imported":
      return m.stage_imported();
    case "available":
      return m.stage_available();
    default:
      return m.stage_unrecognised();
  }
}

/** One notable thing that happened to an item, in one line. */
function momentLine(moment: Moment): string {
  switch (moment.outcome) {
    case "grabbed":
      return m.trace_grabbed({ at: moment.at });
    case "download-failed":
      return m.trace_download_failed({ at: moment.at });
    case "imported":
      return m.trace_imported({ at: moment.at });
    case "removed":
      return m.trace_removed({ at: moment.at });
    default:
      return m.trace_other({ at: moment.at });
  }
}

/** Where one item is, line by line. */
export function traceLines(report: Traced): readonly string[] {
  if (!report.matched) return [m.trace_unmatched({ item: report.item })];
  const lines: string[] = [
    m.trace_furthest({
      item: report.item,
      stage: wordOfStage(report.furthest),
    }),
  ];
  if (report.stall !== undefined && report.stall !== null) {
    lines.push(report.stall);
  }
  if (report.confidence === "uncertain") lines.push(m.trace_uncertain());
  const { coverage } = report;
  if (coverage !== undefined && coverage !== null) {
    lines.push(
      m.trace_coverage({
        have: String(coverage.have),
        wanted: String(coverage.wanted),
      }),
    );
  }
  lines.push(
    ...report.stages.map(stageLine),
    ...report.findings,
    ...report.history.map(momentLine),
  );
  return lines;
}

/** Where a walkthrough ended up, in words. */
function wordOfWalk(state: Walked["state"]): string {
  switch (state) {
    case "offered":
      return m.walk_offered();
    case "skipped":
      return m.walk_skipped();
    case "searching":
    case "grabbing":
    case "downloading":
    case "importing":
      return m.walk_under_way();
    case "complete":
      return m.walk_complete();
    case "failed":
      return m.walk_failed();
    case "abandoned":
      return m.walk_abandoned();
    default:
      return m.walk_unrecognised();
  }
}

/** One thing to do next, in words. */
function wordOfNext(
  next: NonNullable<Walked["handover"]>["next"][number],
): string {
  switch (next) {
    case "more-content":
      return m.walk_next_more();
    case "household":
      return m.walk_next_household();
    case "client-apps":
      return m.walk_next_apps();
    default:
      return m.walk_next_other();
  }
}

/** What walking one thing through came to, line by line. */
export function walkthroughLines(report: Walked): readonly string[] {
  const lines: string[] = [wordOfWalk(report.state), report.proves];
  if (report.already_here) lines.push(m.walk_already_here());
  for (const said of report.lines) {
    lines.push(said.said);
    if (said.detail !== "") lines.push(said.detail);
  }
  const { stopped, handover, link } = report;
  if (link === "hardlinked") lines.push(m.walk_hardlinked());
  if (link === "copied") lines.push(m.walk_copied());
  if (stopped !== undefined && stopped !== null) {
    lines.push(...stopped.logs, stopped.remedy);
  }
  if (report.suggestions.length > 0) {
    lines.push(m.walk_suggestions({ names: listed(report.suggestions) }));
  }
  if (handover !== undefined && handover !== null) {
    lines.push(...handover.next.map(wordOfNext));
  }
  return lines;
}

/** How a guard over the data location ended, line by line. */
export function guardLines(report: Guarded): readonly string[] {
  const lines: string[] = [report.reason];
  if (report.forms.length > 0) {
    const names = listed(report.forms);
    lines.push(
      report.stopped
        ? m.guard_stopped({ names })
        : m.guard_not_stopped({ names }),
    );
  }
  return lines;
}
