/**
 * What the console can ask lemonfiber to do, and how the asking reads.
 *
 * An action is named the way the command line names it, so a control here is a
 * command a person could have typed. Seven of the twelve are offered. Five are
 * about the forms the stack declares and are asked for against the ones the
 * operator chose; two are about the whole stack and take no argument at all.
 *
 * An argument an action's command has nowhere to put is refused rather than
 * dropped, so only the arguments an action takes are ever sent. Which action
 * takes which is stated here as a list, because the alternative is knowing it by
 * having read the one function that builds a body.
 *
 * The operator's agreement is never sent. The three actions whose command
 * carries one are not among the seven, and an agreement given to an action that
 * takes none is an agreement about a request that was never made.
 *
 * Some of what is asked for finishes before the reply is written, and some is
 * handed to the runtime and outlives the request. The second kind is answered
 * with a name, and the name is redeemable: a record says what the reply said
 * until what became of the work is known, and then says that instead.
 *
 * The words live in `messages/`, so no screen holds one. The words a record
 * carries from lemonfiber are lemonfiber's own and are passed through unchanged.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import type { Arguments } from "../api/acting";
import type { State } from "./state";
import type { Forms } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Something the console can ask for, named as the endpoint names it.
 */
export type Doing =
  "up" | "down" | "switch" | "restart" | "pull" | "seed" | "adopt";

/**
 * Every action there is, in the order the controls show them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyDoing: readonly Doing[] = [
  "up",
  "down",
  "switch",
  "restart",
  "pull",
  "seed",
  "adopt",
];

/**
 * The actions whose command carries the forms it was given.
 *
 * The lifecycle five, and nothing else. Wiring the programs to each other and
 * keeping the operator's own edits are whole-stack requests: no command has a
 * field to narrow them by, so a form named to either is a narrowing that was
 * never available and would be refused.
 */
export const takesForms: readonly Doing[] = [
  "up",
  "down",
  "switch",
  "restart",
  "pull",
];

/**
 * The actions that must be told which forms, and can do nothing without them.
 *
 * Switching to nothing, restarting nothing and fetching nothing are each a
 * request that has lost its subject. Starting and stopping can mean everything,
 * so naming no form to either is a whole-stack request rather than a mistake.
 */
export const namesItsForms: readonly Doing[] = ["switch", "restart", "pull"];

/**
 * What to send for one action, given what the operator chose.
 *
 * The carrier is the one the request is made with rather than a second shape of
 * the same fields: what an action takes is one fact, and stating it twice is
 * where the two come to disagree.
 */
export function givenFor(doing: Doing, chosen: readonly string[]): Arguments {
  return takesForms.includes(doing) ? { forms: chosen } : {};
}

/**
 * Whether an action can be asked for at all, given what the operator chose.
 */
export function askable(doing: Doing, chosen: readonly string[]): boolean {
  return chosen.length > 0 || !namesItsForms.includes(doing);
}

/** What is asked before a costly action is carried out. */
export interface Question {
  /** The state in the question's own words. */
  readonly eyebrow: string;
  /** What is about to happen, as a question. */
  readonly title: string;
  /** What it costs, and what it does not. */
  readonly prose: string;
  /** The words on the control that goes ahead. */
  readonly yes: string;
}

/**
 * What has to be agreed before an action is asked for, or nothing where it
 * costs nothing to ask.
 *
 * Asked here rather than sent. Stopping takes what is running away from
 * everyone using it, and lemonfiber's own command takes no agreement for a
 * teardown — what it puts down, starting puts back — so the question is this
 * screen's to ask and no field travels with the answer.
 *
 * Starting takes nothing away, and a stack already running is not disturbed by
 * being told to run. Neither is fetching newer images, which applies none of
 * them, nor wiring programs that are already wired.
 */
export function questionOf(
  doing: Doing,
  scoped: boolean,
): Question | undefined {
  if (doing !== "down") return undefined;
  return {
    eyebrow: m.confirm_stop_eyebrow(),
    title: scoped ? m.confirm_stop_chosen_title() : m.confirm_stop_title(),
    prose: m.confirm_stop_prose(),
    yes: scoped ? m.action_stop_those() : m.action_stop_everything(),
  };
}

/**
 * Whether asking for this costs something that has to be answered first.
 */
export function costly(doing: Doing): boolean {
  return questionOf(doing, false) !== undefined;
}

/** A costly action awaiting a yes, and what is being asked about it. */
export interface Asking {
  /** The action that will be asked for on a yes. */
  readonly doing: Doing;
  /** What is being asked. */
  readonly question: Question;
}

/**
 * What is being asked, where something is waiting on an answer.
 *
 * An action that costs nothing is never held up for one, so naming it here
 * asks nothing and holds nothing up.
 */
export function askingOf(
  doing: Doing | undefined,
  scoped: boolean,
): Asking | undefined {
  if (doing === undefined) return undefined;
  const question = questionOf(doing, scoped);
  return question === undefined ? undefined : { doing, question };
}

/**
 * The words on the control that asks for it.
 *
 * Every control says what it acts on, because a reader listing the controls on
 * a screen is given the names and nothing around them. Only the two that can
 * mean the whole stack have two ways of saying it.
 */
export function wordOfDoing(doing: Doing, scoped: boolean): string {
  switch (doing) {
    case "up":
      return scoped ? m.action_start_chosen() : m.action_start_stack();
    case "down":
      return scoped ? m.action_stop_chosen() : m.action_stop_stack();
    case "switch":
      return m.action_switch_chosen();
    case "restart":
      return m.action_restart_chosen();
    case "pull":
      return m.action_pull_chosen();
    case "seed":
      return m.action_seed();
    case "adopt":
      return m.action_adopt();
  }
}

/**
 * What a record of it is headed by: what was asked for, as it is happening.
 */
export function titleOfDoing(doing: Doing, scoped: boolean): string {
  switch (doing) {
    case "up":
      return scoped ? m.doing_up_chosen_title() : m.doing_up_title();
    case "down":
      return scoped ? m.doing_down_chosen_title() : m.doing_down_title();
    case "switch":
      return m.doing_switch_title();
    case "restart":
      return m.doing_restart_title();
    case "pull":
      return m.doing_pull_title();
    case "seed":
      return m.doing_seed_title();
    case "adopt":
      return m.doing_adopt_title();
  }
}

/** What every record of a request carries, whatever became of it. */
interface Asked {
  /** What names this record, so a reader can put one of several away. */
  readonly id: string;
  /** What was asked for. */
  readonly doing: Doing;
  /** Whether it named forms, which is what the record is headed by. */
  readonly scoped: boolean;
}

/**
 * One thing this tab asked for, and what came of it.
 *
 * `under-way` is work the runtime holds and this page is still asking about.
 * `done` is work that has finished — either it never left lemonfiber's own
 * files and was answered outright, or the name it was given has been redeemed.
 * `stopped` is work that ran and failed, in the words the failure rendered.
 * `forgotten` is a name this run no longer knows, which is absence rather than
 * an unfinished wait. `adrift` is this page having lost the thread: the work
 * may still be running and there is no longer any way to ask. `declined` is
 * lemonfiber refusing the request, in its own sentence.
 */
export type Work =
  | (Asked & {
      readonly at: "under-way";
      /** The name lemonfiber gave the work. */
      readonly job: string;
    })
  | (Asked & {
      readonly at: "done";
      /** The name it was redeemed under, where one was ever given. */
      readonly job: string | undefined;
    })
  | (Asked & {
      readonly at: "stopped";
      /** What went wrong, in lemonfiber's own words. */
      readonly said: string;
    })
  | (Asked & { readonly at: "forgotten"; readonly job: string })
  | (Asked & {
      readonly at: "adrift";
      readonly job: string;
      /** Why it could not be asked, in lemonfiber's own words. */
      readonly said: string;
    })
  | (Asked & {
      readonly at: "declined";
      /** Why not, in lemonfiber's own words. */
      readonly said: string;
    });

/** Every way a record can read, in the order they are worth walking. */
export const everyStanding: readonly Work["at"][] = [
  "under-way",
  "done",
  "stopped",
  "forgotten",
  "adrift",
  "declined",
];

/** How a record reads: how much it wants the operator, and what it says. */
export interface Read {
  /** How much the thing behind the record can be trusted. */
  readonly state: State;
  /** Where it got to, in the record's own words. */
  readonly eyebrow: string;
  /** The rest of it. */
  readonly prose: string;
}

/**
 * What a record says.
 *
 * Work the runtime holds is `part`: it is unfinished rather than untrusted, and
 * the interface reads unfinished in full ink. A name this run has forgotten is
 * `unknown` rather than an alarm — nothing is wrong, there is only nothing left
 * to say. A page that has lost the thread reads `quiet`, which is what the last
 * thing a source said is worth everywhere else on this screen.
 */
export function readingOf(work: Work): Read {
  switch (work.at) {
    case "under-way":
      return {
        state: "part",
        eyebrow: m.eyebrow_taken_on(),
        prose: m.work_under_way({ job: work.job }),
      };
    case "done":
      return {
        state: "known",
        eyebrow: m.eyebrow_finished(),
        prose:
          work.job === undefined
            ? m.work_done()
            : m.work_finished({ job: work.job }),
      };
    case "stopped":
      return {
        state: "stopped",
        eyebrow: m.eyebrow_stopped_short(),
        prose: work.said,
      };
    case "forgotten":
      return {
        state: "unknown",
        eyebrow: m.eyebrow_forgotten(),
        prose: m.work_forgotten({ job: work.job }),
      };
    case "adrift":
      return {
        state: "quiet",
        eyebrow: m.eyebrow_lost_track(),
        prose: m.work_adrift({ job: work.job, said: work.said }),
      };
    case "declined":
      return {
        state: "stopped",
        eyebrow: m.eyebrow_refused(),
        prose: work.said,
      };
  }
}

/**
 * Everything the panels that act are given, and what pressing them asks for.
 *
 * Handed down as one value rather than as a dozen props: what the console holds
 * about acting is one thing, and a screen that took it apart would have to put
 * it back together to pass it on. The forms are here rather than beside the
 * other readings because nothing draws them except the two panels that act.
 */
export interface Controls {
  /** Every form the stack declares, or why they could not be listed. */
  readonly forms: Reading<Forms> | undefined;
  /** The forms the operator chose, by the id the listing gave them. */
  readonly chosen: readonly string[];
  /** What this tab has asked for, newest first. */
  readonly work: readonly Work[];
  /** The newest thing a wait said, in lemonfiber's own words. */
  readonly waiting: string | undefined;
  /** The costly action awaiting a yes, where one is. */
  readonly confirming: Doing | undefined;
  /** Whether a request is still in flight, which is what silences the controls. */
  readonly busy: boolean;
  /** What taking a form up or putting it down asks for. */
  readonly onchoose: (form: string) => void;
  /** What pressing a control asks for. */
  readonly onpress: (doing: Doing) => void;
  /** What answering no to a costly action asks for. */
  readonly onleave: () => void;
  /** What putting a record away asks for. */
  readonly ondrop: (id: string) => void;
  /** What putting the wait's newest line away asks for. */
  readonly onhush: () => void;
}
