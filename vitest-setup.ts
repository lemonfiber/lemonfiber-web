import "@testing-library/jest-dom/vitest";

/**
 * jsdom lays nothing out, so nothing is ever resized: an observer that is told
 * nothing, and answers nothing, is the whole of what a resize observer does
 * there.
 */
class Unresized {
  observe(): undefined {
    return undefined;
  }
  unobserve(): undefined {
    return undefined;
  }
  disconnect(): undefined {
    return undefined;
  }
}
Object.assign(globalThis, { ResizeObserver: Unresized });

/** jsdom scrolls nothing, so bringing something into view is nothing to do. */
Element.prototype.scrollIntoView = (): undefined => undefined;

/**
 * jsdom lays nothing out, so nothing ever comes on screen: an observer that is
 * told of nothing. A test that needs a place to come on screen stands in its own.
 */
class Unseen {
  observe(): undefined {
    return undefined;
  }
  unobserve(): undefined {
    return undefined;
  }
  disconnect(): undefined {
    return undefined;
  }
  takeRecords(): [] {
    return [];
  }
}
Object.assign(globalThis, { IntersectionObserver: Unseen });

/**
 * jsdom draws no dialog over the page, and has no way to open one as it: what
 * is left of opening one is that it is open, and of closing one that it is not
 * and says so, as a browser's does.
 */
HTMLDialogElement.prototype.showModal = function showModal(): void {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(): void {
  this.open = false;
  this.dispatchEvent(new Event("close"));
};
