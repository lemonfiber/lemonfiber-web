/**
 * How much a figure can be trusted, and the words shown for it.
 *
 * Mirrors the core's `Reading<T>`: a figure that is current, one that is the
 * last thing a now-silent source said, and one that was never measured are
 * three different things. Collapsing any two sends an operator after the wrong
 * problem.
 *
 * The words themselves live in `messages/`, so no screen holds one.
 *
 * Spec: 10-functional/features/g-ux/g2-plain-language.md
 */
import * as m from "../paraglide/messages.js";

/**
 * `known` is measured now; `quiet` is the last thing a silent source said.
 */
export type State = "known" | "quiet" | "unknown" | "stopped" | "part";

/**
 * Every state there is, in the order the type declares them.
 *
 * A screen, a story and a test all walk this one list. A sixth state added to
 * the type and to here reaches all three at once, rather than being left out
 * of whichever was not remembered.
 */
export const everyState: readonly State[] = [
  "known",
  "quiet",
  "unknown",
  "stopped",
  "part",
];

/**
 * How urgently a state wants the operator.
 */
export type Tone = "calm" | "watch" | "alarm";

/** Every severity there is, in the order they grow. */
export const everyTone: readonly Tone[] = ["calm", "watch", "alarm"];

/**
 * How much ink a figure carrying this state is given.
 *
 * `words` is the one that matters: a figure with no measurement behind it is
 * shown as words, never as a numeral. "0 B/s" and "not known" mean opposite
 * things and must not look alike.
 */
export type Showing = "ink" | "dim" | "words";

/**
 * The word an operator reads. Never jargon.
 */
export function wordFor(state: State): string {
  switch (state) {
    case "known":
      return m.state_known();
    case "quiet":
      return m.state_quiet();
    case "unknown":
      return m.state_unknown();
    case "stopped":
      return m.state_stopped();
    case "part":
      return m.state_part();
  }
}

/**
 * Whether a figure carrying this state is current.
 */
export function isCurrent(state: State): boolean {
  return state === "known";
}

/**
 * Colour follows the state; weight follows the tone.
 *
 * `unknown` is calm: not knowing something is not an emergency, and giving it a
 * severity would make it compete with one.
 */
export function toneFor(state: State): Tone {
  switch (state) {
    case "known":
    case "unknown":
      return "calm";
    case "quiet":
    case "part":
      return "watch";
    case "stopped":
      return "alarm";
  }
}

/**
 * The word a severity says when it stands on its own, with no text beside it.
 */
export function severityWord(tone: Tone): string {
  switch (tone) {
    case "calm":
      return m.severity_calm();
    case "watch":
      return m.severity_watch();
    case "alarm":
      return m.severity_alarm();
  }
}

/**
 * How a figure carrying this state is shown.
 *
 * `part` is measured now — it is unfinished, not untrusted — so it reads in
 * full ink. `stopped` has no figure to show at all, so it reads as words.
 */
export function showingFor(state: State): Showing {
  switch (state) {
    case "known":
    case "part":
      return "ink";
    case "quiet":
      return "dim";
    case "unknown":
    case "stopped":
      return "words";
  }
}
