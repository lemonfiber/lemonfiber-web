/**
 * What the server says, in the words this interface already has.
 *
 * The envelope carries the server's own vocabulary: nine things a service can be
 * doing, eight gradings of a stack, seven ways a download can be stuck. The
 * interface has five states and three severities, and one place that maps one
 * onto the other is what keeps a screen from inventing a sixth.
 *
 * The payload types are taken from the contract the server generated rather than
 * restated here, so a field that changes shape is a compiler error and not a
 * blank space on a panel.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import type { State, Tone } from "./state";
import * as m from "../paraglide/messages.js";

/** What each service is doing, as the two readings of it answer. */
export type Stack = ByKind["status"]["data"];

/** Every form the stack declares, as the listing of them answers. */
export type Forms = ByKind["forms"]["data"];

/** One form the stack declares, in the manifest's own words. */
export type Form = Forms["forms"][number];

/** One moment of the whole stack, as the stream delivers it. */
export type Moment = ByKind["dashboard"]["data"];

/** What a diagnostic run found, as the checks answer. */
export type Diagnosis = ByKind["doctor"]["data"];

/** One thing a check established, and how it turned out. */
export type Finding = Diagnosis["findings"][number];

/** How a single check turned out. */
export type Verdict = Finding["verdict"];

/** The word a verdict answers with. */
export type Outcome = Verdict["outcome"];

/** What a whole run of checks amounts to. */
export type Overall = Diagnosis["overall"];

/** The family a check belongs to. */
export type Category = Finding["category"];

/** One thing the operator can do about a problem. */
export type Remedy = Extract<Verdict, { outcome: "unverified" }>["remedy"];

/** One line of output from one service. */
export type Logged = ByKind["log"]["data"];

/** One of this product's own words, as the read that explains one answers. */
export type Word = ByKind["word"]["data"];

/** What the household has asked for, member by member. */
export type Household = ByKind["household"]["data"];

/** One member, and everything they have asked for. */
export type Member = Household["members"][number];

/** One thing a member asked for. */
export type Request = Member["requests"][number];

/** Where one request stands, in the words the person who made it would use. */
export type RequestState = NonNullable<Request["state"]>;

/** What a panel holds where its source could fill it. */
type Ready<P> = P extends { panel: "ready"; data: infer T } ? T : never;

/** One service, as it stands. */
export type Service = Stack["services"][number];

/** The one-line grading every surface reads. */
export type Health = Moment["health"];

/** The disk, or the reason it could not be read. */
export type Disk = Moment["storage"];

/** The disk, where it could be read. */
export type Space = Ready<Disk>;

/** The active downloads, or the reason they could not be listed. */
export type Transfers = Moment["transfers"];

/** The per-service queues, or the reason they could not be read. */
export type Queues = Moment["queue"];

/** One active download. */
export type Transfer = Ready<Moment["transfers"]>[number];

/** One service's queue. */
export type Waiting = Ready<Moment["queue"]>[number];

/** Anything the stream delivers as a panel: its content, or why there is none. */
export type Held = Disk | Transfers | Queues;

/** One thing in the pipeline that has stopped. */
export type Stall = Moment["stuck"][number];

/**
 * A figure, and how much the source behind it could stand behind it.
 *
 * The same three-way answer the interface's own states are built on, which is
 * why a speed and a count of bytes free both arrive in this shape.
 */
export type Measured = Space["free"];

/** How much a figure can be trusted, and the figure where there is one. */
export interface Figure {
  readonly state: State;
  readonly figure: string | undefined;
}

/** Every state a service can be in, in the order the contract declares them. */
export const everyServiceState: readonly Service["state"][] = [
  "failed",
  "crash-looping",
  "unhealthy",
  "absent",
  "stopped",
  "starting",
  "running",
  "healthy",
  "host-managed",
];

/** Every grading a stack can be given. */
export const everyStanding: readonly Health["standing"][] = [
  "healthy",
  "stopped",
  "unconfigured",
  "advisory",
  "degraded",
  "broken",
  "critical",
  "unknown",
];

/** Every reading of what a set of services amounts to. */
export const everyCondition: readonly Stack["condition"][] = [
  "inactive",
  "degraded",
  "partial",
  "active",
];

/** Every way something in the pipeline can be stuck. */
export const everyStall: readonly Stall["stall"][] = [
  "redownload-loop",
  "repeated-import-failure",
  "completed-not-imported",
  "orphaned",
  "stalled-download",
  "waiting-indefinitely",
  "slow",
];

/** Every way an import can put a finished download into the library. */
export const everyLink: readonly Space["hardlink"][] = [
  "linking",
  "copying",
  "unknown",
];

/**
 * How much a service's own state lets a figure about it be trusted.
 *
 * A service that is up but failing its own health check is showing figures that
 * were true once, which is what `quiet` means everywhere else. One the engine
 * does not run is not a thing this has ever measured.
 */
export function stateOfService(state: Service["state"]): State {
  switch (state) {
    case "healthy":
    case "running":
      return "known";
    case "starting":
      return "part";
    case "unhealthy":
      return "quiet";
    case "failed":
    case "crash-looping":
    case "stopped":
    case "absent":
      return "stopped";
    case "host-managed":
      return "unknown";
  }
}

/**
 * Why a panel could not be filled, where it could not be.
 *
 * The words are the source's own. An unavailable panel says why in the terms the
 * source used, which is worth more than any reading of it and is the difference
 * between a panel that is empty and one that is empty for a reason.
 */
export function reasonOf(held: Held | undefined): string | undefined {
  return held?.panel === "unavailable" ? held.data.reason : undefined;
}

/**
 * A figure and the trust behind it, from a reading of it.
 */
export function figureOf(
  reading: Measured,
  written: (value: number) => string,
): Figure {
  switch (reading.reading) {
    case "known":
      return { state: "known", figure: written(reading.value) };
    case "stale":
      return { state: "quiet", figure: written(reading.value) };
    case "unknown":
      return { state: "unknown", figure: undefined };
  }
}

/**
 * How much the count of things wanting attention can be trusted.
 *
 * A stack nobody has graded has no count, and a zero would read as "nothing is
 * wrong" rather than as "nothing has looked".
 */
export function stateOfStanding(standing: Health["standing"]): State {
  return standing === "unknown" || standing === "unconfigured"
    ? "unknown"
    : "known";
}

/**
 * How badly a grading wants the operator.
 *
 * A stack that was stopped on purpose is worth seeing and is not an emergency,
 * and neither is one nobody has set up yet.
 */
export function toneOfStanding(standing: Health["standing"]): Tone {
  switch (standing) {
    case "healthy":
    case "unconfigured":
    case "unknown":
      return "calm";
    case "advisory":
    case "degraded":
    case "stopped":
      return "watch";
    case "broken":
    case "critical":
      return "alarm";
  }
}

/**
 * The grading, in one phrase.
 */
export function wordOfStanding(standing: Health["standing"]): string {
  switch (standing) {
    case "healthy":
      return m.standing_healthy();
    case "stopped":
      return m.standing_stopped();
    case "unconfigured":
      return m.standing_unconfigured();
    case "advisory":
      return m.standing_advisory();
    case "degraded":
      return m.standing_degraded();
    case "broken":
      return m.standing_broken();
    case "critical":
      return m.standing_critical();
    case "unknown":
      return m.standing_unknown();
  }
}

/**
 * What a whole set of services amounts to, as a clause set beside a figure.
 */
export function wordOfCondition(condition: Stack["condition"]): string {
  switch (condition) {
    case "inactive":
      return m.condition_inactive();
    case "degraded":
      return m.condition_degraded();
    case "partial":
      return m.condition_partial();
    case "active":
      return m.condition_active();
  }
}

/**
 * How much a stall wants the operator.
 *
 * Slow and waiting are things happening slowly; the rest are things that have
 * stopped and will not start again on their own.
 */
export function stateOfStall(stall: Stall["stall"]): State {
  switch (stall) {
    case "slow":
    case "waiting-indefinitely":
      return "part";
    case "redownload-loop":
    case "repeated-import-failure":
    case "completed-not-imported":
    case "orphaned":
    case "stalled-download":
      return "stopped";
  }
}

/**
 * What is wrong with it, as a sentence.
 */
export function wordOfStall(stall: Stall["stall"]): string {
  switch (stall) {
    case "redownload-loop":
      return m.stall_redownload_loop();
    case "repeated-import-failure":
      return m.stall_repeated_import_failure();
    case "completed-not-imported":
      return m.stall_completed_not_imported();
    case "orphaned":
      return m.stall_orphaned();
    case "stalled-download":
      return m.stall_stalled_download();
    case "waiting-indefinitely":
      return m.stall_waiting_indefinitely();
    case "slow":
      return m.stall_slow();
  }
}

/**
 * What the import did with the finished download.
 */
export function wordOfLink(link: Space["hardlink"]): string {
  switch (link) {
    case "linking":
      return m.schematic_linked_not_copied();
    case "copying":
      return m.link_copying();
    case "unknown":
      return m.value_cannot_say();
  }
}
