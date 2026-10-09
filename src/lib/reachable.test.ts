import { afterEach, describe, expect, it, vi } from "vitest";
import { reachable } from "./reachable";

/** A box whose contents are `inner` wide in a box `outer` wide. */
function box(inner: number, outer: number): HTMLElement {
  const scroller = document.createElement("div");
  scroller.append(document.createElement("table"));
  Object.defineProperty(scroller, "scrollWidth", {
    value: inner,
    configurable: true,
  });
  Object.defineProperty(scroller, "clientWidth", {
    value: outer,
    configurable: true,
  });
  return scroller;
}

describe("a box that scrolls sideways", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("takes focus while its contents are wider than it, and lets go when they fit", () => {
    let resized: () => void = () => undefined;
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe(element: Element): void {
          observed.push(element);
        }
        disconnect = disconnect;
      },
    );
    const wide = box(900, 375);
    const stop = reachable(wide);
    expect(wide.getAttribute("tabindex")).toBe("0");
    expect(observed).toStrictEqual([wide, wide.firstElementChild]);
    Object.defineProperty(wide, "scrollWidth", { value: 300 });
    resized();
    expect(wide.hasAttribute("tabindex")).toBe(false);
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
