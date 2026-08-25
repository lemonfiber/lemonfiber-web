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
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import type { Word } from "../lib/wire";
import { asked, type Reaching } from "./asking";

/** The read that answers what a word means. */
const EXPLAIN = "explain";

/** Asking what one word means. */
export type Explaining = (word: string) => Promise<Reading<Word>>;

/**
 * A way of asking what a word means, which asks about each word once.
 */
export function explaining(reaching: Reaching): Explaining {
  const answers = new Map<string, Promise<Reading<Word>>>();

  return (word: string) => {
    const held = answers.get(word);
    if (held !== undefined) return held;

    const asking = asked(reaching, EXPLAIN, "word", { word }).then((answer) => {
      if (!answer.ok) answers.delete(word);
      return answer;
    });
    answers.set(word, asking);
    return asking;
  };
}
