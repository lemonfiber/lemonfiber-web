/**
 * Where a domain term sits in a line of text, so the line can explain it
 * where it stands.
 *
 * The terms are lemonfiber's glossary: each word, every form lemonfiber writes
 * it in, and every other service's word for the same thing. A line is cut into
 * the text around each term and the term itself, which keeps the spelling the
 * line used and names the word the glossary files it under. A term is found
 * whole, never inside a longer word, and whatever its case; where two terms
 * could start at one place the longer is taken, so `hardlinks` is not read as
 * `hardlink` and a trailing `s`.
 *
 * Nothing here decides whether a line is explained at all. That is the
 * reader's switch, kept by `../routes/explained.svelte`.
 */
import type { Entry, Vocabulary } from "./glossary";

/** One run of a line: plain text, or a term and the word it is filed under. */
export interface Piece {
  /** The text as the line spells it. */
  readonly text: string;
  /** The word the glossary files it under, where the text is a term. */
  readonly word?: string | undefined;
}

/** Finds the terms in a line. */
export interface Finder {
  /** Every spelling of every term, longest first, as one expression. */
  readonly pattern: RegExp | undefined;
  /** The word each spelling is filed under, by its spelling in lower case. */
  readonly filed: ReadonlyMap<string, string>;
}

/** A spelling as an expression matches it, with nothing in it read as syntax. */
function escaped(spelling: string): string {
  return spelling.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** Every spelling one entry is met under. */
function spellingsOf(entry: Entry): readonly string[] {
  return [entry.word, ...entry.forms, ...entry.also_called];
}

/**
 * A finder for every term the glossary holds. A spelling two entries share is
 * filed under the first that names it, which is the order the glossary reads.
 */
export function finderOf(vocabulary: Vocabulary): Finder {
  const filed = new Map<string, string>();
  for (const entry of vocabulary.words) {
    for (const spelling of spellingsOf(entry)) {
      const key = spelling.toLowerCase();
      if (key.trim() !== "" && !filed.has(key)) filed.set(key, entry.word);
    }
  }
  if (filed.size === 0) return { pattern: undefined, filed };
  const alternatives = [...filed.keys()]
    .sort((a, b) => b.length - a.length)
    .map((spelling) => escaped(spelling));
  const pattern = new RegExp(
    String.raw`(?<![\p{L}\p{N}])(?:${alternatives.join("|")})(?![\p{L}\p{N}])`,
    "giu",
  );
  return { pattern, filed };
}

/** A line cut into its plain runs and the terms in it, in order. */
export function piecesOf(text: string, finder: Finder): readonly Piece[] {
  const { pattern, filed } = finder;
  if (pattern === undefined) return [{ text }];
  const pieces: Piece[] = [];
  let from = 0;
  for (const found of text.matchAll(pattern)) {
    const [spelled] = found;
    if (found.index > from)
      pieces.push({ text: text.slice(from, found.index) });
    pieces.push({ text: spelled, word: filed.get(spelled.toLowerCase()) });
    from = found.index + spelled.length;
  }
  if (from < text.length || pieces.length === 0) {
    pieces.push({ text: text.slice(from) });
  }
  return pieces;
}
