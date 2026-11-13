/**
 * What the suites put in place of the browser's watch on what is on screen: a
 * watch that tells every gallery each picture it was handed is in view at once.
 */
import { vi } from "vitest";

/** Every picture a gallery watches is on screen as soon as it is watched. */
export function everythingInView(): void {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly #told: (entries: { isIntersecting: boolean }[]) => void;
      constructor(told: (entries: { isIntersecting: boolean }[]) => void) {
        this.#told = told;
      }
      observe(): undefined {
        this.#told([{ isIntersecting: true }]);
        return undefined;
      }
      disconnect(): undefined {
        return undefined;
      }
    },
  );
}
