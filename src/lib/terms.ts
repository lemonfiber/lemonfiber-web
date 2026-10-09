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
 * Text between backticks is code, as lemonfiber writes a command or a setting
 * into a sentence, and is handed back marked as code whether or not terms are
 * being found. No term is found inside code, nor inside a run of text that is
 * an address, a path or a setting's name, such as `LEMONFIBER_REACH_INDEXER`
 * or `…/d1-seed/…`: a word there is part of a name, not the word.
 *
 * Nothing here decides whether a line is explained at all. That is the
 * reader's switch, kept by `../routes/explained.svelte`.
 */
import type { Entry, Vocabulary } from "./glossary";

/** One run of a line: plain text, code, or a term and the word it is filed under. */
export interface Piece {
  /** The text as the line spells it, without the backticks around code. */
  readonly text: string;
  /** The word the glossary files it under, where the text is a term. */
  readonly word?: string | undefined;
  /** Whether the text is code: a command or a name, set between backticks. */
  readonly code?: true | undefined;
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

/** Code between backticks. */
const CODE = /`[^`]+`/gu;

/**
 * A run of text that names something rather than saying a word: an address, a
 * path, or a name joined by underscores.
 */
const NAMED = /\S*[/_]\S*/gu;

/** A line cut into its plain runs and its code, before any term is looked for. */
function codeOf(text: string): readonly Piece[] {
  const pieces: Piece[] = [];
  let from = 0;
  for (const found of text.matchAll(CODE)) {
    if (found.index > from)
      pieces.push({ text: text.slice(from, found.index) });
    pieces.push({ text: found[0].slice(1, -1), code: true });
    from = found.index + found[0].length;
  }
  if (from < text.length || pieces.length === 0) {
    pieces.push({ text: text.slice(from) });
  }
  return pieces;
}

/** Where the runs that name something sit in a stretch of text. */
function namedIn(text: string): readonly (readonly [number, number])[] {
  return [...text.matchAll(NAMED)].map(
    (found) => [found.index, found.index + found[0].length] as const,
  );
}

/** One stretch of plain text cut at its terms. */
function termsOf(text: string, finder: Finder): readonly Piece[] {
  const { pattern, filed } = finder;
  if (pattern === undefined) return [{ text }];
  const named = namedIn(text);
  const pieces: Piece[] = [];
  let from = 0;
  for (const found of text.matchAll(pattern)) {
    const [spelled] = found;
    const end = found.index + spelled.length;
    if (named.some(([start, stop]) => found.index >= start && end <= stop)) {
      continue;
    }
    if (found.index > from)
      pieces.push({ text: text.slice(from, found.index) });
    pieces.push({ text: spelled, word: filed.get(spelled.toLowerCase()) });
    from = end;
  }
  if (from < text.length || pieces.length === 0) {
    pieces.push({ text: text.slice(from) });
  }
  return pieces;
}

/**
 * A line cut into its plain runs, its code and the terms in it, in order. With
 * no finder, which is explaining switched off, only the code is marked.
 */
export function piecesOf(
  text: string,
  finder: Finder | undefined,
): readonly Piece[] {
  return codeOf(text).flatMap((piece) =>
    piece.code === true || finder === undefined
      ? [piece]
      : termsOf(piece.text, finder),
  );
}
