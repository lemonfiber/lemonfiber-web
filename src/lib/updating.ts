/**
 * Moving the stack onto the versions this build pins, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice. Unconfirmed
 * it changes nothing and answers with every step it would take and what each
 * means, under an offer naming those steps. The yes is the same request,
 * confirmed, carrying that offer back, so it takes the steps that were read or
 * is refused where they have moved since; and it carries whether what the
 * download clients are still working on is let finish first where the plan
 * names anything they are.
 *
 * Either asking may name one service, which narrows the steps to that
 * service's alone; the yes then carries the name with the offer read for it,
 * and what is downloading is read for that service alone.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family, type Stopper } from "./asker";
import { stoppingServices, wholeStack, type Stopping } from "./inflight";
import type { Step } from "./updated";
import { titleOfDoing } from "./titled";
import type { Requested, Updating, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the updates panel makes. */
export const everyUpdating: readonly Updating[] = ["update"];

/** Whether a record is of something the updates panel asked for. */
export function isUpdating(doing: Requested): doing is Updating {
  const updating: readonly Requested[] = everyUpdating;
  return updating.includes(doing);
}

/** One asking, about the whole stack or about one service by its name. */
export type Update =
  /** What moving onto the pins would change, with nothing changed. */
  | { readonly doing: "update"; readonly service?: string }
  /** The move made, agreed to after reading what it would change. */
  | {
      readonly doing: "update";
      readonly service?: string;
      readonly confirm: true;
      readonly wait: boolean;
      /** The offer the steps agreed to were read under, as it named itself. */
      readonly offer: string;
    };

/** What to send for one asking. */
export function givenForUpdate(update: Update): Arguments {
  const named = update.service === undefined ? {} : { service: update.service };
  return "confirm" in update
    ? { ...named, confirm: true, wait: update.wait, offer: update.offer }
    : named;
}

/** What moving the whole stack, or one service of it, would stop. */
export function stoppingOfUpdate(service: string | undefined): Stopping {
  return service === undefined ? wholeStack : stoppingServices([service]);
}

/** How the updates panel's requests are asked for. */
export const updating: Family<Update> = {
  owns: isUpdating,
  question: () => undefined,
  given: givenForUpdate,
  same: sameDoing,
  stops: (update) =>
    "confirm" in update ? undefined : stoppingOfUpdate(update.service),
};

/** A plan standing for a yes, and the record it came on. */
export interface Plan {
  /** The record, which is what putting the plan away puts away. */
  readonly id: string;
  /** Every step it would take. */
  readonly steps: readonly Step[];
  /** The name the offer gave itself, which the yes carries. */
  readonly offer: string;
  /** The one service it moves, where it moves one alone. */
  readonly service: string | undefined;
}

/**
 * The plan standing on the screen, where one is: the newest update asked for,
 * answered with steps to take and not yet agreed to.
 */
export function standingPlan(work: readonly Work[]): Plan | undefined {
  const newest = work.find((one) => one.doing === "update");
  if (newest?.at !== "done" || newest.came.kind !== "update") return undefined;
  const { report } = newest.came;
  if (report.confirmed || report.state !== "updates-available") {
    return undefined;
  }
  return {
    id: newest.id,
    steps: report.changes,
    offer: report.offer,
    service: newest.given.service,
  };
}

/** The yes to a plan, letting what is downloading finish first or not. */
export function yesTo(plan: Plan, wait: boolean): Update {
  const agreed = {
    doing: "update",
    confirm: true,
    wait,
    offer: plan.offer,
  } as const;
  return plan.service === undefined
    ? agreed
    : { ...agreed, service: plan.service };
}

/** What a plan is headed by: the whole stack's versions, or one service's. */
export function titleOfPlan(plan: Plan): string {
  return plan.service === undefined
    ? m.update_plan_title()
    : m.update_one_title({ service: plan.service });
}

/** Whether each step of a plan is offered moving alone. */
export function movesApart(plan: Plan): boolean {
  return plan.service === undefined && plan.steps.length > 1;
}

/** What a record of an update is headed by, naming the one service it moved. */
export function titleOfUpdate(one: Work): string {
  const { service } = one.given;
  return service === undefined
    ? titleOfDoing(one.doing, one.scoped)
    : m.doing_update_one_title({ service });
}

/**
 * Everything the updates panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Updater = Asker<Update> & Stopper;
