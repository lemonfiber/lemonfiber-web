/**
 * Running a run-and-exit service at once, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice. The first
 * is a rehearsal: it runs nothing and answers whether a run would go now or
 * what holds it back. The yes is the same request without the rehearsal, and
 * is offered only where nothing held the rehearsal back.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import { ranLines } from "./ran";
import type { Scheduled } from "./scheduled";
import type { Requested, Scheduling, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the scheduled panel makes. */
export const everyScheduling: readonly Scheduling[] = ["run"];

/** Whether a record is of something the scheduled panel asked for. */
export function isScheduling(doing: Requested): doing is Scheduling {
  const scheduling: readonly Requested[] = everyScheduling;
  return scheduling.includes(doing);
}

/** One asking, about one service by its id. */
export type Run =
  /** What running it now would come to, with nothing run. */
  | { readonly doing: "run"; readonly service: string }
  /** The run, agreed to after reading its rehearsal. */
  | { readonly doing: "run"; readonly service: string; readonly agreed: true };

/** What to send for one asking. */
export function givenForRun(run: Run): Arguments {
  return "agreed" in run
    ? { service: run.service, now: true }
    : { service: run.service, now: true, dry_run: true };
}

/** How the scheduled panel's requests are asked for. */
export const scheduling: Family<Run> = {
  owns: isScheduling,
  question: () => undefined,
  given: givenForRun,
  same: sameDoing,
};

/** A rehearsal standing for a yes, and the record it came on. */
export interface Rehearsed {
  /** The record, which is what putting the rehearsal away puts away. */
  readonly id: string;
  /** The service it is about, by its id. */
  readonly service: string;
  /** What that service is called. */
  readonly name: string;
  /** What reading it means: what the yes does, or that nothing can run now. */
  readonly said: string;
  /** What the rehearsal found, a sentence at a time. */
  readonly lines: readonly string[];
  /** Whether a run would go now, so the yes is offered. */
  readonly ready: boolean;
}

/**
 * The rehearsal standing on the screen, where one is: the newest run asked
 * for, answered as a rehearsal, with the service named as `scheduled` calls it.
 */
export function standingRun(
  work: readonly Work[],
  scheduled: readonly Scheduled[],
): Rehearsed | undefined {
  const newest = work.find((one) => one.doing === "run");
  if (newest?.at !== "done" || newest.came.kind !== "ran") return undefined;
  const { report } = newest.came;
  if (!report.rehearsed) return undefined;
  const held = report.held ?? undefined;
  const ready = report.due && held === undefined;
  return {
    id: newest.id,
    service: report.service,
    name:
      scheduled.find((one) => one.id === report.service)?.name ??
      report.service,
    said: ready ? m.scheduled_rehearsal_prose() : m.scheduled_rehearsal_held(),
    lines: ranLines(report),
    ready,
  };
}

/**
 * Everything the scheduled panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Runner = Asker<Run>;
