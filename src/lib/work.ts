/**
 * What the console can ask lemonfiber to do, and how the asking reads.
 *
 * An action is named the way the command line names it, so a control here is a
 * command a person could have typed. Only the two that need no argument this
 * surface cannot supply are offered: the rest of the twelve either name a form,
 * which nothing this page can read lists, or belong on a screen that is not
 * built.
 *
 * Some of what is asked for finishes before the reply is written, and some is
 * handed to the runtime and outlives the request. Both end up here as a record
 * of what this tab asked for, which is what gives work that outlives a request
 * somewhere to live.
 *
 * The words live in `messages/`, so no screen holds one. The words a record
 * carries from lemonfiber are lemonfiber's own and are passed through unchanged.
 */
import type { State } from "./state";
import * as m from "../paraglide/messages.js";

/**
 * Something the console can ask for, named as the endpoint names it.
 */
export type Doing = "up" | "down";

/**
 * Every action there is, in the order the controls show them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyDoing: readonly Doing[] = ["up", "down"];

/** What is asked before a costly action is carried out. */
export interface Question {
  /** The state in the question's own words. */
  readonly eyebrow: string;
  /** What is about to happen, as a question. */
  readonly title: string;
  /** What it costs, and what it does not. */
  readonly prose: string;
}

/**
 * What has to be agreed before an action is asked for, or nothing where it
 * costs nothing to ask.
 *
 * Stopping takes the whole stack away from everyone using it. Starting takes
 * nothing away, and a stack already running is not disturbed by being told to
 * run.
 */
export function questionOf(doing: Doing): Question | undefined {
  switch (doing) {
    case "up":
      return undefined;
    case "down":
      return {
        eyebrow: m.confirm_stop_eyebrow(),
        title: m.confirm_stop_title(),
        prose: m.confirm_stop_prose(),
      };
  }
}

/**
 * Whether asking for this costs something that has to be agreed first.
 */
export function costly(doing: Doing): boolean {
  return questionOf(doing) !== undefined;
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
export function askingOf(doing: Doing | undefined): Asking | undefined {
  if (doing === undefined) return undefined;
  const question = questionOf(doing);
  return question === undefined ? undefined : { doing, question };
}

/**
 * The words on the control that asks for it.
 */
export function wordOfDoing(doing: Doing): string {
  switch (doing) {
    case "up":
      return m.action_start_stack();
    case "down":
      return m.action_stop_stack();
  }
}

/**
 * What a record of it is headed by: what was asked for, as it is happening.
 */
export function titleOfDoing(doing: Doing): string {
  switch (doing) {
    case "up":
      return m.doing_up_title();
    case "down":
      return m.doing_down_title();
  }
}

/**
 * One thing this tab asked for, and what came of it.
 *
 * `under-way` is work the runtime holds: the reply named it and said nothing
 * else about it, and closing the tab does not stop it. `done` is work that
 * never left lemonfiber's own files and had finished by the time it could be
 * answered. `declined` is lemonfiber saying no, in its own sentence.
 */
export type Work =
  | {
      readonly id: string;
      readonly doing: Doing;
      readonly at: "under-way";
      /** The name lemonfiber gave the work. */
      readonly job: string;
    }
  | { readonly id: string; readonly doing: Doing; readonly at: "done" }
  | {
      readonly id: string;
      readonly doing: Doing;
      readonly at: "declined";
      /** Why not, in lemonfiber's own words. */
      readonly said: string;
    };

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
 * the interface reads unfinished in full ink. A refusal is `stopped`, which is
 * the one state that carries an alarm.
 *
 * A record says what happened rather than what is happening. Nothing tells this
 * page that work handed to the runtime has ended, so a record that claimed the
 * work was still going would be this page's guess rather than lemonfiber's word.
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
        prose: m.work_done(),
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
 * Everything the panel of controls is given, and what pressing them asks for.
 *
 * Handed down as one value rather than as eight props: what the console holds
 * about acting is one thing, and a screen that took it apart would have to put
 * it back together to pass it on.
 */
export interface Controls {
  /** What this tab has asked for, newest first. */
  readonly work: readonly Work[];
  /** The newest thing a wait said, in lemonfiber's own words. */
  readonly waiting: string | undefined;
  /** The costly action awaiting a yes, where one is. */
  readonly confirming: Doing | undefined;
  /** Whether a request is still in flight, which is what silences the controls. */
  readonly busy: boolean;
  /** What pressing a control asks for. */
  readonly onpress: (doing: Doing) => void;
  /** What answering no to a costly action asks for. */
  readonly onleave: () => void;
  /** What putting a record away asks for. */
  readonly ondrop: (id: string) => void;
  /** What putting the wait's newest line away asks for. */
  readonly onhush: () => void;
}
