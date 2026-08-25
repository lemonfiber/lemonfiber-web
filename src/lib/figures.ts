/**
 * Figures the wire states as numbers, written as an operator reads them.
 *
 * Nothing here decides anything. A count of bytes and a count of bytes a second
 * are the same figure in different clothes, and both are the server's, so this
 * only chooses the unit and how many digits survive it.
 *
 * No words: a unit is a symbol rather than a sentence, and a figure is data.
 */

/** The units a count of bytes is written in, smallest first. */
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/** How many of one unit make the next. */
const STEP = 1024;

/** Above this a fraction says nothing the whole number does not. */
const FRACTIONS_BELOW = 10;

/** What a percentage is out of. */
const WHOLE = 100;

/**
 * A size, with one decimal only where it still carries information.
 */
function digits(size: number): string {
  return size < FRACTIONS_BELOW && !Number.isInteger(size)
    ? size.toFixed(1)
    : String(Math.round(size));
}

/**
 * How many bytes, in the largest unit that leaves a figure worth reading.
 *
 * A negative count is a count of nothing: bytes free is a measure of what is
 * there, and less than none of it is not a state a disk can be in.
 */
export function bytes(count: number): string {
  let size = Math.max(0, count);
  let unit: string = UNITS[0];

  for (const named of UNITS) {
    unit = named;
    if (size < STEP) break;
    size /= STEP;
  }

  return `${digits(size)} ${unit}`;
}

/**
 * How many bytes a second.
 */
export function rate(perSecond: number): string {
  return `${bytes(perSecond)}/s`;
}

/**
 * How many of something.
 */
export function tally(count: number): string {
  return String(Math.round(count));
}

/**
 * A percentage from zero to a hundred, as the share from zero to one that a
 * bar is drawn from.
 */
export function share(percent: number): number {
  return percent / WHOLE;
}
