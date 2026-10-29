/**
 * Moving the settings the services read, or taking the operator's value away,
 * and how the asking reads.
 *
 * Two requests, named as the endpoint names them, each asked for twice about
 * the same settings. Asked as a rehearsal it writes nothing and answers with
 * what the change would come to: each setting it moves, every entry it
 * rewrites, what it restarts, and the name that reading goes by. There is no
 * bare yes. The yes is the same change carrying that name, so what is written
 * is what was read, or lemonfiber refuses and says what moved. Several
 * settings move in one act, so the ones whose choices depend on each other
 * move together.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Valuing } from "./requested";
import type { Unvetted } from "./unvetted";
import type { Change } from "./values";
import type { Requested, Work } from "./work";

/** Every request the settings panel makes. */
export const everyValuing: readonly Valuing[] = [
  "settings-set",
  "settings-clear",
];

/** Whether a record is of something the settings panel asked for. */
export function isValuing(doing: Requested): doing is Valuing {
  const valuing: readonly Requested[] = everyValuing;
  return valuing.includes(doing);
}

/** Each setting moved, to the value it is to hold. */
interface Moving {
  readonly doing: "settings-set";
  readonly values: Readonly<Record<string, string>>;
}

/** Each setting whose operator value is taken away. */
interface Clearing {
  readonly doing: "settings-clear";
  readonly settings: readonly string[];
}

/** The settings asked about, and what is asked of them. */
export type Asked = Moving | Clearing;

/** One asking. */
export type Value =
  /** What the change would come to, with nothing written. */
  | Asked
  /** The change written, agreed to under the reading that named itself. */
  | (Asked & { readonly offer: string });

/** The settings a change is about, as its request takes them. */
function namedFor(asked: Asked): Arguments {
  return asked.doing === "settings-set"
    ? { values: asked.values }
    : { settings: asked.settings };
}

/** What to send for one asking. */
export function givenForValue(value: Value): Arguments {
  const named = namedFor(value);
  return "offer" in value
    ? { ...named, offer: value.offer }
    : { ...named, dry_run: true };
}

/** How the settings panel's requests are asked for. */
export const valuing: Family<Value> = {
  owns: isValuing,
  question: () => undefined,
  given: givenForValue,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed the settings, which changes what
 * the settings screen reads. A rehearsal wrote nothing.
 */
export function changedByValuing(came: Came): boolean {
  return came.kind === "settings" && came.report.change?.applied === true;
}

/** A reading standing for a yes, and the record it came on. */
export type Offered = Asked & {
  /** The record, which is what putting the reading away puts away. */
  readonly id: string;
  /** The name the reading gave itself, which the yes carries. */
  readonly offer: string;
  /** What the change would come to. */
  readonly change: Change;
  /** The operator's own overlay, where it changes a service. */
  readonly unvetted: Unvetted | undefined;
};

/** The settings a record asked about, where it names them. */
function askedOf(doing: Requested, given: Work["given"]): Asked | undefined {
  const { values, settings } = given;
  if (doing === "settings-set") {
    return values === undefined ? undefined : { doing, values };
  }
  return settings === undefined
    ? undefined
    : { doing: "settings-clear", settings };
}

/**
 * The reading standing on the screen, where one is: the newest change asked
 * for, answered with what it would come to and nothing written.
 */
export function standingValue(work: readonly Work[]): Offered | undefined {
  const newest = work.find((one) => isValuing(one.doing));
  if (newest?.at !== "done" || newest.came.kind !== "settings") {
    return undefined;
  }
  const { report } = newest.came;
  const { change } = report;
  if (!report.rehearsed || change === undefined || change === null) {
    return undefined;
  }
  const asked = askedOf(newest.doing, newest.given);
  if (asked === undefined) return undefined;
  return {
    ...asked,
    id: newest.id,
    offer: change.agreement,
    change,
    unvetted: report.unvetted ?? undefined,
  };
}

/**
 * Everything the settings panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Valuer = Asker<Value>;
