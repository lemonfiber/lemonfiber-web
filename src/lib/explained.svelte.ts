/**
 * Whether this browser explains domain terms where they stand, and what it
 * explains them from.
 *
 * Explaining is on until the reader turns it off, and the choice is kept in
 * this browser alone: it is a reader's convenience, not a setting of the
 * stack, and a browser that keeps nothing (a private window, cleared storage)
 * simply starts with it on again.
 *
 * The terms are lemonfiber's glossary, read once and held here; an
 * explanation is answered from it rather than asked of lemonfiber term by
 * term. Until the glossary arrives, or where it could not be read, nothing is
 * marked, so a line never reads as explained by a table that is not there.
 */
import { missing, type Reading } from "@lemonfiber/sdk-ts";
import { getContext, setContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import type { Vocabulary } from "./glossary";
import { finderOf, type Finder } from "./terms";
import type { Explaining, Word } from "./wire";
import { asked, turnedAway, type Reaching } from "../api/asking";

/** Where this browser keeps whether explaining is on. */
export const KEPT = "lemonfiber.explained";

/** What is kept when explaining has been turned off. */
const OFF = "off";

/** The context the console hands its explaining to every line it draws through. */
const CONTEXT = Symbol("explained");

/** The slice of browser storage this needs, so a test can supply its own. */
export type Keeping = Pick<Storage, "getItem" | "setItem">;

/** This browser's storage, or nothing where reaching it throws. */
export function browserKeeping(): Keeping | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** Whether storage kept explaining off, or nothing where it cannot be read. */
function keptOff(keeping: Keeping | undefined): boolean {
  try {
    return keeping?.getItem(KEPT) === OFF;
  } catch {
    return false;
  }
}

export class Explained {
  readonly #keeping: Keeping | undefined;
  #on = $state(true);
  #read = $state<Reading<Vocabulary> | undefined>(undefined);

  constructor(keeping: Keeping | undefined = browserKeeping()) {
    this.#keeping = keeping;
    this.#on = !keptOff(keeping);
  }

  /** Whether terms are explained where they stand. */
  get on(): boolean {
    return this.#on;
  }

  /** Turn explaining on or off, and keep the choice where this browser can. */
  set on(on: boolean) {
    this.#on = on;
    try {
      this.#keeping?.setItem(KEPT, on ? "on" : OFF);
    } catch {
      // A browser that keeps nothing still honours the choice until it reloads.
    }
  }

  /**
   * Read the glossary and hold it, handing a refused key to `onrefused`.
   */
  read(reaching: Reaching, onrefused: () => void): void {
    void asked(reaching, "explain", "glossary").then((read) => {
      this.hold(read);
      if (turnedAway(read)) onrefused();
    });
  }

  /** Hold the glossary as read, or why it could not be. */
  hold(read: Reading<Vocabulary>): void {
    this.#read = read;
  }

  /** The glossary as read, or why it could not be, or nothing before it answered. */
  get glossary(): Reading<Vocabulary> | undefined {
    return this.#read;
  }

  /** The glossary held, where it was read. */
  readonly #vocabulary: Vocabulary | undefined = $derived(
    this.#read?.ok === true ? this.#read.value : undefined,
  );

  /** What finds the terms in a line, where there is a glossary to find them in. */
  readonly finder: Finder | undefined = $derived(
    this.#vocabulary === undefined ? undefined : finderOf(this.#vocabulary),
  );

  /** What one word means, answered from the glossary held. */
  readonly explain: Explaining = (word: string): Promise<Reading<Word>> => {
    const entry = this.#vocabulary?.words.find((one) => one.word === word);
    return Promise.resolve(
      entry === undefined
        ? { ok: false, problem: missing(word) }
        : { ok: true, value: entry },
    );
  };
}

/** Explaining as a component's context holds it, for one mounted on its own. */
export function explainedIn(explained: Explained): Map<symbol, Explained> {
  return new SvelteMap([[CONTEXT, explained]]);
}

/** Hand explaining to everything this component draws, and keep it. */
export function handExplained(explained: Explained): Explained {
  return setContext(CONTEXT, explained);
}

/** The explaining handed down to here, where any was. */
export function explainedHere(): Explained | undefined {
  return getContext<Explained | undefined>(CONTEXT);
}
