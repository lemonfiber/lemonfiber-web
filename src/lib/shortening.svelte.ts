/**
 * A long list, shortened to its first few until the reader asks for all of it.
 *
 * A panel that lists every credential, service or check runs to thousands of
 * pixels, and a newcomer reading the screen meets the hundredth row before the
 * next panel. Each long list therefore shows its first few and says how many
 * there are; the whole of it is one press away, for whoever wants it.
 */

/** How many of a long list are shown before the rest is asked for. */
export const SHORT = 5;

/**
 * How many are shown of a list whose every entry runs to several lines, such
 * as a credential or a service with its account beneath it.
 */
export const SHORT_DETAILED = 3;

export class Shortening {
  /** Whether the reader asked for the whole list. */
  whole = $state(false);

  /** How many are shown while the list is short. */
  readonly keep: number;

  constructor(keep: number = SHORT) {
    this.keep = keep;
  }

  /** The part of a list that is shown. */
  of<T>(items: readonly T[]): readonly T[] {
    return this.whole ? items : items.slice(0, this.keep);
  }

  /**
   * The part of a list that is shown, with any entry further down that must
   * stay in view, such as one the reader has chosen.
   */
  keeping<T>(items: readonly T[], kept: (item: T) => boolean): readonly T[] {
    return this.whole
      ? items
      : items.filter((item, at) => at < this.keep || kept(item));
  }

  /** Whether a list is long enough to be shortened. */
  shortens(items: readonly unknown[]): boolean {
    return items.length > this.keep;
  }

  /** Show the whole list, or only its first few again. */
  readonly flip = (): void => {
    this.whole = !this.whole;
  };
}
