/**
 * Restarting the forms chosen, or running only them, read first.
 *
 * A restart takes every service it reaches away from whoever is using it while
 * it comes back, and a switch stops every service the forms chosen do not hold,
 * so neither is sent at once. Pressing one rehearses it: lemonfiber changes
 * nothing and answers with the services it would restart or stop. The yes is
 * the act itself. A restart carries back the offer naming what was read, so
 * lemonfiber restarts exactly that, or refuses before anything restarts where
 * it has changed since.
 */
import type { Arguments } from "../api/acting";
import * as m from "../paraglide/messages.js";
import type { Work } from "./work";

/** A rehearsed restart or switch standing for a yes, and the record it came on. */
export interface Offered {
  /** Which of the two it is. */
  readonly doing: "restart" | "switch";
  /** The record, which is what answering the offer puts away. */
  readonly id: string;
  /** Whether it named forms, which the yes is named by as well. */
  readonly scoped: boolean;
  /** The forms it was rehearsed against, which the yes names again. */
  readonly forms: readonly string[];
  /** Every service it would restart or stop, in the order the stack gives them. */
  readonly stops: readonly string[];
  /** The name the offer gave itself, which the yes carries, where it gave one. */
  readonly offer: string | undefined;
}

/** What pressing restart or switch sends: the forms chosen, rehearsed. */
export function rehearsingStop(chosen: readonly string[]): Arguments {
  return { forms: chosen, dry_run: true };
}

/**
 * The restart or switch a record offers, where it is one: a restart rehearsal
 * that came back with the services it would restart under an offer, or a
 * switch rehearsal that came back with the services it would stop.
 */
export function offeredStop(work: Work): Offered | undefined {
  if (work.doing !== "restart" && work.doing !== "switch") return undefined;
  if (work.at !== "done" || work.came.kind !== "lifecycle") return undefined;
  const { report } = work.came;
  if (!report.rehearsed) return undefined;
  const offer = report.offer ?? undefined;
  const shared = { id: work.id, scoped: work.scoped, forms: report.plan.forms };
  if (work.doing === "switch") {
    const switched = report.switched ?? undefined;
    if (switched === undefined) return undefined;
    return { ...shared, doing: "switch", stops: switched.stopped, offer };
  }
  if (offer === undefined) return undefined;
  return { ...shared, doing: "restart", stops: report.plan.services, offer };
}

/** What the yes sends: the forms it was read against, and the offer read. */
export function agreedStop(offered: Offered): Arguments {
  return offered.offer === undefined
    ? { forms: offered.forms }
    : { forms: offered.forms, offer: offered.offer };
}

/** What a rehearsed restart or switch asks, in words. */
export interface StopQuestion {
  readonly eyebrow: string;
  readonly title: string;
  readonly prose: string;
  readonly heading: string;
  /** The yes, where there is anything to agree to. */
  readonly yes: string | undefined;
}

/** What a rehearsed restart or switch asks before its yes. */
export function stopQuestion(offered: Offered): StopQuestion {
  const stops = offered.stops.length > 0;
  if (offered.doing === "switch") {
    return {
      eyebrow: m.confirm_switch_eyebrow(),
      title: m.confirm_switch_title(),
      prose: stops ? m.confirm_switch_prose() : m.confirm_switch_nothing(),
      heading: m.confirm_switch_heading(),
      yes: m.action_switch_these(),
    };
  }
  return {
    eyebrow: m.confirm_restart_eyebrow(),
    title: m.confirm_restart_title(),
    prose: stops ? m.confirm_restart_prose() : m.confirm_restart_nothing(),
    heading: m.confirm_restart_heading(),
    yes: stops ? m.action_restart_these() : undefined,
  };
}

/** What a record is called while a restart or a switch is being read. */
export function rehearsalTitle(doing: Work["doing"]): string {
  return doing === "switch"
    ? m.doing_switch_reading()
    : m.doing_restart_reading();
}
