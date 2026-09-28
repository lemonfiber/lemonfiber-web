/**
 * What a panel that asks lemonfiber for something is handed, and how one family
 * of requests is asked for.
 *
 * Every such panel works the same way: a control asks, a request that has
 * nothing to read first is asked about before it is sent, and what came of each
 * request is a record the panel draws. What differs between families is which
 * requests they make, what each sends, and which of them is asked about first.
 */
import type { Arguments } from "../api/acting";
import type { Question, Requested, Work } from "./work";

/** One asking a panel makes, named by the request it is for. */
export interface Asking {
  /** The request, as the endpoint names it. */
  readonly doing: Requested;
}

/** How one family of requests is asked for. */
export interface Family<A extends Asking> {
  /** Whether a record is of a request this family makes. */
  readonly owns: (doing: Requested) => boolean;
  /**
   * What has to be agreed before an asking is sent, or nothing where what
   * comes back is the thing to read before agreeing.
   */
  readonly question: (asking: A) => Question | undefined;
  /** What to send for an asking. */
  readonly given: (asking: A) => Arguments;
  /**
   * Whether two askings are the same request, which is what a yes has to be
   * about to be a yes to it.
   */
  readonly same: (one: A | undefined, other: A) => boolean;
}

/** Whether two askings ask for the same request, whatever they name. */
export function sameDoing<A extends Asking>(
  one: A | undefined,
  other: A,
): boolean {
  return one?.doing === other.doing;
}

/**
 * Everything a panel that asks is given to act with, and what pressing its
 * controls asks for.
 */
export interface Asker<A extends Asking> {
  /** What the panel has asked for, newest first. */
  readonly work: readonly Work[];
  /** The asking awaiting a yes, where one is. */
  readonly asked: A | undefined;
  /** Whether a request is still in flight, which silences the controls. */
  readonly busy: boolean;
  /** What pressing a control asks for. */
  readonly onask: (asking: A) => void;
  /** What answering no asks for. */
  readonly onleave: () => void;
  /** What putting a record away asks for. */
  readonly ondrop: (id: string) => void;
}
