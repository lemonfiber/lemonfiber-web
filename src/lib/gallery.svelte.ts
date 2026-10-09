/**
 * The pictures on a member's shelf, fetched while they are on screen and let
 * go once they are not.
 *
 * A poster is asked for with the session's key, as every read is, so the page
 * cannot hand its address to an image and let the browser fetch it: the key
 * travels in a header no image request carries, and no cookie stands in for
 * it. Each picture is fetched here instead and drawn from an object address
 * this page made for the bytes, which holds no copy as text and is revoked the
 * moment the poster leaves the screen.
 *
 * Only what is on screen is asked for, a few at a time, so a long shelf does
 * not ask for everything at once. A picture that could not be had is not asked
 * for again, and its title stays lettered.
 */
import { untrack } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

/** How many pictures are asked for at once. */
export const AT_ONCE = 4;

/** How far ahead of the screen a poster counts as on it, so it arrives in time. */
const AHEAD = "200px";

/** Asking for one title's picture, answered with its bytes or with nothing. */
export type Taking = (id: string) => Promise<Blob | undefined>;

export class Gallery {
  /** The address each picture on screen is drawn from, by its title's id. */
  readonly #drawn = new SvelteMap<string, string>();

  /**
   * The titles on screen now, each with how many places show it: a title can
   * be on a shelf and in what a member was part-way through at once, and its
   * picture is let go only once neither shows it.
   */
  readonly #wanted = new SvelteMap<string, number>();

  /** The titles waiting for a turn to be asked for. */
  #waiting: string[] = [];

  /** The titles whose picture could not be had. */
  readonly #missing = new SvelteSet<string>();

  /** How many are being asked for. */
  #asking = 0;

  readonly #taking: Taking;
  readonly #atOnce: number;

  constructor(taking: Taking, atOnce: number = AT_ONCE) {
    this.#taking = taking;
    this.#atOnce = atOnce;
  }

  /** Where a title's picture is drawn from, while it has one on screen. */
  drawnFrom(id: string): string | undefined {
    return this.#drawn.get(id);
  }

  /** A title came on screen: ask for its picture, unless it is had or missing. */
  readonly want = (id: string): void => {
    const places = this.#wanted.get(id) ?? 0;
    this.#wanted.set(id, places + 1);
    if (places > 0) return;
    if (this.#missing.has(id)) return;
    this.#waiting.push(id);
    this.#next();
  };

  /**
   * One place showing a title left the screen. Once none shows it, stop
   * waiting for it, and let its picture go.
   */
  readonly release = (id: string): void => {
    const places = (this.#wanted.get(id) ?? 0) - 1;
    if (places > 0) {
      this.#wanted.set(id, places);
      return;
    }
    this.#let(id);
  };

  /** Stop waiting for a title's picture, and let it go. */
  #let(id: string): void {
    this.#wanted.delete(id);
    this.#waiting = this.#waiting.filter((one) => one !== id);
    const drawn = this.#drawn.get(id);
    if (drawn === undefined) return;
    URL.revokeObjectURL(drawn);
    this.#drawn.delete(id);
  }

  /** Let every picture go, as the shelf leaves the page. */
  readonly releaseAll = (): void => {
    for (const id of [...this.#wanted.keys(), ...this.#drawn.keys()]) {
      this.#let(id);
    }
  };

  /** Ask for the next waiting pictures, as many as may be asked for at once. */
  #next(): void {
    while (this.#asking < this.#atOnce) {
      const id = this.#waiting.shift();
      if (id === undefined) return;
      this.#asking += 1;
      void this.#take(id);
    }
  }

  /** Ask for one picture, and draw it if its title is still on screen. */
  async #take(id: string): Promise<void> {
    const bytes = await this.#taking(id).catch(() => undefined);
    this.#asking -= 1;
    if (bytes === undefined) {
      this.#missing.add(id);
    } else if (this.#wanted.has(id)) {
      this.#drawn.set(id, URL.createObjectURL(bytes));
    }
    this.#next();
  }
}

/**
 * Watch one poster's place on the page, asking for its picture while it is on
 * screen and letting it go once it is not.
 */
export function onScreen(gallery: Gallery, id: string) {
  return (place: Element): (() => void) => {
    const watching = new IntersectionObserver(
      (entries) => {
        // Untracked, so a place that is already on screen as it is first
        // watched does not make the watching depend on what the gallery holds.
        untrack(() => {
          for (const entry of entries) {
            if (entry.isIntersecting) gallery.want(id);
            else gallery.release(id);
          }
        });
      },
      { rootMargin: AHEAD },
    );
    watching.observe(place);
    return () => {
      watching.disconnect();
      untrack(() => {
        gallery.release(id);
      });
    };
  };
}
