/**
 * A walkthrough's steps as they happen, in lines a reader can carry.
 *
 * The stream says each step a walk takes while it is taking it, under the job
 * the walk's accepting reply named, so the steps heard are kept by job and a
 * walk still going is narrated from them. Each step is said as lemonfiber
 * said it, after a word for the stage it belongs to, with any detail beside.
 *
 * What lemonfiber writes into a step is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** One step of a walkthrough, as the stream says it. */
export type Step = ByKind["step"]["data"];

/** The steps heard so far, by the job of the walk that is taking them. */
export type Heard = Readonly<Record<string, readonly Step[]>>;

/** The stage a step belongs to, in one word. */
export function wordOfStepStage(stage: Step["step"]): string {
  switch (stage) {
    case "choosing":
      return m.step_choosing();
    case "searching":
      return m.step_searching();
    case "grabbing":
      return m.step_grabbing();
    case "downloading":
      return m.step_downloading();
    case "importing":
      return m.step_importing();
    case "scanning":
      return m.step_scanning();
    case "available":
      return m.step_available();
    default:
      return m.step_other();
  }
}

/** One step, in a line: its stage, what lemonfiber said, and any detail. */
export function stepLine(step: Step): string {
  const said = { stage: wordOfStepStage(step.step), said: step.said };
  return step.detail === ""
    ? m.step_line(said)
    : m.step_line_detail({ ...said, detail: step.detail });
}

/** The steps heard with one more, kept under the job it was said for. */
export function heardWith(heard: Heard, job: string, step: Step): Heard {
  return { ...heard, [job]: [...(heard[job] ?? []), step] };
}

/** The lines a walk still going is narrated with, or none before a step is heard. */
export function walkingLines(heard: Heard, job: string): readonly string[] {
  return (heard[job] ?? []).map((step) => stepLine(step));
}
