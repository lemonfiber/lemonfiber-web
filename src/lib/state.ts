/**
 * How much a figure can be trusted, and the words shown for it.
 *
 * Spec: 10-functional/features/g-ux/g2-plain-language.md
 */

/** `known` is measured now; `quiet` is the last thing a silent source said. */
export type State = "known" | "quiet" | "unknown" | "stopped" | "part";

/** How urgently a state wants the operator. */
export type Tone = "calm" | "watch" | "alarm";

/** The word an operator reads. Never jargon. */
export function wordFor(state: State): string {
  switch (state) {
    case "known":
      return "Working";
    case "quiet":
      return "Gone quiet";
    case "unknown":
      return "Never measured";
    case "stopped":
      return "Stopped";
    case "part":
      return "Part way";
  }
}

/** Whether a figure carrying this state is current. */
export function isCurrent(state: State): boolean {
  return state === "known";
}

/**
 * Colour follows the state; weight follows the tone.
 *
 * `unknown` is calm: not knowing something is not an emergency.
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
