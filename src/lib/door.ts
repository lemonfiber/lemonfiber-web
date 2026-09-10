/**
 * The household's front door, in the words this interface already has.
 *
 * Five standings, six things a published service can be to the people in the
 * house, and three ways a door came to be the one it is. The interface has five
 * states and three severities, so the readings here are what keep a screen from
 * inventing a sixth.
 *
 * A running lemonfiber's vocabulary can be wider than the contract this build
 * was generated against, so every reading says so rather than falling off the
 * end of its switch.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { State, Tone } from "./state";
import type { Chosen, DoorStanding, Facing } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Every standing the front door can be in, in the order the contract declares
 * them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyDoorStanding: readonly DoorStanding[] = [
  "established",
  "library-only",
  "unreachable",
  "stranded",
  "none",
];

/** Everything a published service can be to the people in the house. */
export const everyFacing: readonly Facing[] = [
  "asking",
  "watching",
  "shelf",
  "operators",
  "carriage",
  "unstated",
];

/**
 * How much the door's own standing lets the address beside it be trusted.
 *
 * A door that is answering with nowhere to be reached at has half of what a
 * household member needs, which is what `part` means everywhere else. One this
 * stack publishes nothing behind was never a door, so there is nothing here
 * that has been measured.
 */
export function stateOfDoor(standing: DoorStanding): State {
  switch (standing) {
    case "established":
    case "library-only":
      return "known";
    case "stranded":
      return "part";
    case "unreachable":
      return "stopped";
    case "none":
      return "unknown";
    default:
      return "unknown";
  }
}

/**
 * How badly the door's standing wants the operator.
 *
 * A stack that publishes nothing to the house is a configuration rather than a
 * fault, and so is one whose library is the only thing to arrive at.
 */
export function toneOfDoor(standing: DoorStanding): Tone {
  switch (standing) {
    case "established":
    case "library-only":
    case "none":
      return "calm";
    case "stranded":
      return "watch";
    case "unreachable":
      return "alarm";
    default:
      return "calm";
  }
}

/**
 * Where the door stands, in one phrase.
 */
export function wordOfDoorStanding(standing: DoorStanding): string {
  switch (standing) {
    case "established":
      return m.door_established();
    case "library-only":
      return m.door_library_only();
    case "unreachable":
      return m.door_unreachable();
    case "stranded":
      return m.door_stranded();
    case "none":
      return m.door_none();
    default:
      return m.door_unrecognised();
  }
}

/**
 * What one published service is to the people in the house.
 */
export function wordOfFacing(facing: Facing): string {
  switch (facing) {
    case "asking":
      return m.facing_asking();
    case "watching":
      return m.facing_watching();
    case "shelf":
      return m.facing_shelf();
    case "operators":
      return m.facing_operators();
    case "carriage":
      return m.facing_carriage();
    case "unstated":
      return m.facing_unstated();
    default:
      return m.facing_unrecognised();
  }
}

/**
 * How this came to be the door, as a sentence.
 *
 * A door the operator named and this stack refused is the one an operator has
 * to read, so what they wrote and why it is not the door are carried into the
 * sentence rather than left to the standing above it.
 */
export function saidOfChosen(chosen: Chosen): string {
  switch (chosen.chosen) {
    case "derived":
      return m.door_derived();
    case "named":
      return m.door_named({ door: chosen.door });
    case "refused":
      return m.door_refused({
        named: chosen.door.named,
        because: chosen.door.because,
      });
    default:
      return m.door_chosen_unrecognised();
  }
}
