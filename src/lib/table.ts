/**
 * What a table is made of: its columns, what sits in a cell, and what a row is.
 *
 * A column says how its cells are set — from the left, from the right in the
 * figure face, or as the narrow strip a row's controls sit in. A cell says
 * either words or "whatever this snippet draws", so a bar, a tag, a figure or
 * a button reaches a cell without the table knowing which of them it is.
 *
 * A row is either answered or silent. A source that has stopped answering
 * blanks its own row and says so in place of the figures, and that shape lives
 * here rather than being assembled by each screen that needs it.
 */
import type { Snippet } from "svelte";

/**
 * What a column holds.
 *
 * `words` reads from the left. `figure` reads from the right in the figure
 * face, so a column of numerals lines up on its units rather than on its first
 * digit. `control` is the strip a row's buttons sit in: as narrow as the
 * widest of them, and never wrapped.
 */
export type ColumnKind = "words" | "figure" | "control";

/**
 * Every kind there is, in the order the type declares them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyColumnKind: readonly ColumnKind[] = [
  "words",
  "figure",
  "control",
];

/**
 * How much ink a cell's words take.
 *
 * `lead` is the thing the row is about; `quiet` is a fact standing beside one;
 * `alarm` is a figure that wants the operator, which the design says in the
 * cell rather than in a tag beside it.
 */
export type Emphasis = "plain" | "quiet" | "lead" | "alarm";

/** Every emphasis there is, from the quietest to the loudest. */
export const everyEmphasis: readonly Emphasis[] = [
  "quiet",
  "plain",
  "lead",
  "alarm",
];

/**
 * One column.
 */
export interface Column {
  /** The heading. Left out for a column the design gives no heading. */
  head?: string | undefined;
  /** What the column holds. `words` where it is not said. */
  kind?: ColumnKind | undefined;
  /** How wide, as CSS, where the design fixes it. */
  width?: string | undefined;
}

/**
 * What sits in one cell: words the table sets itself, or something drawn.
 */
export type Cell =
  | {
      readonly kind: "words";
      /** What the cell says. */
      readonly text: string;
      /** A quieter phrase qualifying the text. */
      readonly caption?: string | undefined;
      /** Puts the caption on a line of its own rather than beside the text. */
      readonly below?: boolean | undefined;
      /** How much ink the words take. `plain` where it is not said. */
      readonly emphasis?: Emphasis | undefined;
    }
  | {
      readonly kind: "drawn";
      /** Whatever the cell holds: a bar, a tag, a figure, a button. */
      readonly draw: Snippet;
    };

/**
 * One row: what a source said, or that it has stopped saying anything.
 */
export type Row =
  | {
      readonly kind: "answered";
      /** Tells this row from the others. Never shown. */
      readonly key: string;
      /** Its cells, in column order. */
      readonly cells: readonly Cell[];
    }
  | {
      readonly kind: "silent";
      /** Tells this row from the others. Never shown. */
      readonly key: string;
      /** What has stopped answering. */
      readonly name: string;
    };
