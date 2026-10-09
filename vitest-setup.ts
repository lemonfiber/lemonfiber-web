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
