/**
 * What one of this product's words means, asked of the table that holds them.
 *
 * The words live in the binary and are served from it, so a surface asks rather
 * than ships its own copy: two answers to what `hardlink` means is what a second
 * copy ends in, and the one in this repository had already drifted from the table
 * it was copied out of.
 *
 * One word, and only once a reader opens it. The whole table can be had in a
 * single document, under a kind the pinned client package does not yet name; a
 * word nobody pressed is a request nobody needed either way. Each answer is kept,
 * so a screen using one word in four sentences asks about it once and a reader
 * opening it twice asks once. An answer that never arrived is not kept, so the
 * next press is another attempt rather than the same silence.
 *
 * A word the table has no entry for is an answer like any other, and is kept.
 * Asking again cannot reach a different one, and a reader who keeps pressing would
 * otherwise put the same question to the binary once per press.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import type { Word } from "../lib/wire";
import { asked, type Reaching } from "./asking";

/** The read that answers what a word means. */
const EXPLAIN = "explain";

/** Asking what one word means. */
export type Explaining = (word: string) => Promise<Reading<Word>>;

/**
 * Whether asking this word again could come back with anything else.
 *
 * A word this product has no entry for is settled: the binary answered, and the
 * answer is that there is nothing to say. Everything else that comes back without
 * an entry is a run that could not answer this time.
 */
const settled = (answer: Reading<Word>): boolean =>
  answer.ok || answer.problem.kind === "missing";

/**
 * A way of asking what a word means, which asks about each word once.
 */
export function explaining(reaching: Reaching): Explaining {
  const answers = new Map<string, Promise<Reading<Word>>>();

  return (word: string) => {
    const held = answers.get(word);
    if (held !== undefined) return held;

    const asking = asked(reaching, EXPLAIN, "word", { word }).then((answer) => {
      if (!settled(answer)) answers.delete(word);
      return answer;
    });
    answers.set(word, asking);
    return asking;
  };
}
