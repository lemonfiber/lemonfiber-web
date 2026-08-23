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
 * How urgently a state wants the operator.
 */
export type Tone = "calm" | "watch" | "alarm";

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
