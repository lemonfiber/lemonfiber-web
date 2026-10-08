/**
 * Acting on a setup already here, and how the asking reads.
 *
 * Four requests, each named as the command line names it and each asked for
 * twice. Asked bare, each changes nothing and answers with what it would come
 * to. Adopting, importing and standing beside are then agreed to with a yes:
 * for adopting and importing, the operator saying they have backed up what was
 * named. Replacing stops what it named, so its yes is the offer that named it,
 * and lemonfiber refuses where what is running has moved since.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Moved } from "./moved";
import type { Moving, Requested, Work } from "./work";

/** Every request the survey panel makes, least disruptive first. */
export const everyMoving: readonly Moving[] = [
  "migrate-adopt",
  "migrate-import",
  "migrate-beside",
  "migrate-replace",
];

/** Whether a record is of something the survey panel asked for. */
export function isMoving(doing: Requested): doing is Moving {
  const moving: readonly Requested[] = everyMoving;
  return moving.includes(doing);
}

/** The acts agreed to with a yes rather than an offer. */
type Agreed = Exclude<Moving, "migrate-replace">;

/** One asking. */
export type Move =
  /** What the act would come to, with nothing changed. */
  | { readonly doing: Moving }
  /** Adopting, importing or standing beside, agreed to. */
  | { readonly doing: Agreed; readonly confirm: true }
  /** Replacing, agreed to under the offer that named what it stops. */
  | { readonly doing: "migrate-replace"; readonly offer: string };

/** What to send for one asking. */
export function givenForMove(move: Move): Arguments {
  if ("offer" in move) return { offer: move.offer };
  if ("confirm" in move) return { confirm: true };
  return {};
}

/** How the survey panel's requests are asked for. */
export const moving: Family<Move> = {
  owns: isMoving,
  question: () => undefined,
  given: givenForMove,
  same: sameDoing,
};

/** The kinds the four acts answer with. */
const MOVES: ReadonlySet<Came["kind"]> = new Set([
  "adoption",
  "beside",
  "import",
  "replacement",
]);

/** Whether a piece of work is one of the four acts. */
function isMove(came: Came): came is Moved {
  return MOVES.has(came.kind);
}

/** Where an act stands, where a piece of work is one of the four acts. */
function stanceOf(came: Came): string | undefined {
  return isMove(came) ? came.report.stance : undefined;
}

/**
 * Whether what a piece of work came to changed what is on this machine, which
 * changes what the checks screen surveys. One still to be agreed to changed
 * nothing.
 */
export function changedByMoving(came: Came): boolean {
  return stanceOf(came) === "applied";
}

/** A yes standing on the screen, and the record it came on. */
export type Standing =
  | {
      readonly id: string;
      readonly doing: Agreed;
    }
  | {
      readonly id: string;
      readonly doing: "migrate-replace";
      /** The name the offer gave itself, which the yes carries. */
      readonly offer: string;
    };

/**
 * The yes standing on the screen, where one is: the newest act asked for,
 * answered with what it would come to and still to be agreed to.
 */
export function standingMove(work: readonly Work[]): Standing | undefined {
  const newest = work.find((one): one is Work & { readonly doing: Moving } =>
    isMoving(one.doing),
  );
  if (newest?.at !== "done" || stanceOf(newest.came) !== "pending") {
    return undefined;
  }
  const { doing, came } = newest;
  if (doing !== "migrate-replace") return { id: newest.id, doing };
  if (came.kind !== "replacement" || came.report.agreement === "") {
    return undefined;
  }
  return { id: newest.id, doing, offer: came.report.agreement };
}

/**
 * Everything the survey panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Mover = Asker<Move>;
