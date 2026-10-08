/**
 * Every word this product explains, in lines a reader can carry.
 *
 * The words come in the order somebody meets them. Each says in one sentence
 * what it is for and what it costs or gains, then more for somebody who asks,
 * where there is more. Where other services in the stack call the same thing
 * by another word, those words are named, so an operator moving between their
 * screens does not have to work out that two of them are one; and where this
 * product writes the word in other forms, those are named too.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Every word this product explains. */
export type Vocabulary = ByKind["glossary"]["data"];

/** One word, and what it means. */
export type Entry = Vocabulary["words"][number];

/** What the table says beyond the one sentence, where it says more. */
export function deeperOf(entry: Entry): string | undefined {
  const { deep } = entry;
  return deep === undefined || deep === null || deep === "" ? undefined : deep;
}

/** One word, line by line. */
export function entryLines(entry: Entry): readonly string[] {
  const { also_called: also, forms } = entry;
  const deep = deeperOf(entry);
  const lines = [entry.short];
  if (deep !== undefined) lines.push(deep);
  if (also.length > 0) lines.push(m.glossary_also({ words: listed(also) }));
  if (forms.length > 0) lines.push(m.glossary_forms({ forms: listed(forms) }));
  return lines;
}
