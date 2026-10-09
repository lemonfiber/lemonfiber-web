import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AT_ONCE, Gallery, onScreen } from "./gallery.svelte";

/** A picture's bytes. */
const picture = new Blob(["poster"], { type: "image/png" });

/** Every address made for a picture, and every one let go. */
let made: string[] = [];
let revoked: string[] = [];

beforeEach(() => {
  made = [];
  revoked = [];
  URL.createObjectURL = (): string => {
    const address = `blob:poster-${String(made.length)}`;
    made.push(address);
    return address;
  };
  URL.revokeObjectURL = (address: string): void => {
    revoked.push(address);
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Every answer already given, taken in. */
const settled = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** A taking whose answers are given by the test, one title at a time. */
function held(): {
  readonly taking: (id: string) => Promise<Blob | undefined>;
  readonly asked: string[];
  readonly answer: (id: string, bytes: Blob | undefined) => Promise<void>;
} {
  const asked: string[] = [];
  const waiting = new Map<string, (bytes: Blob | undefined) => void>();
  return {
    asked,
    taking: (id) =>
      new Promise((resolve) => {
        asked.push(id);
        waiting.set(id, resolve);
      }),
    answer: async (id, bytes) => {
      waiting.get(id)?.(bytes);
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

describe("the pictures on a shelf", () => {
  it("asks for no more than a few at once, and the next as each arrives", async () => {
    const { taking, asked, answer } = held();
    const gallery = new Gallery(taking);
    const ids = Array.from(
      { length: AT_ONCE + 2 },
      (_, at) => `t${String(at)}`,
    );
    for (const id of ids) gallery.want(id);
    expect(asked).toStrictEqual(ids.slice(0, AT_ONCE));

    await answer("t0", picture);

    expect(asked).toStrictEqual(ids.slice(0, AT_ONCE + 1));
    expect(gallery.drawnFrom("t0")).toBe("blob:poster-0");
  });

  it("lets a picture go when its title leaves the screen, and asks again when it comes back", async () => {
    const { taking, asked, answer } = held();
    const gallery = new Gallery(taking);
    gallery.want("t0");
    gallery.want("t0");
    await answer("t0", picture);

    gallery.release("t0");
    expect(gallery.drawnFrom("t0")).toBeUndefined();
    expect(revoked).toStrictEqual(["blob:poster-0"]);

    gallery.want("t0");
    expect(asked).toStrictEqual(["t0", "t0"]);
  });

  it("draws nothing for a title that left before its picture arrived, or was never waited on", async () => {
    const { taking, asked, answer } = held();
    const gallery = new Gallery(taking, 1);
    gallery.want("t0");
    gallery.want("t1");
    gallery.release("t1");
    gallery.release("t0");
    await answer("t0", picture);

    expect(gallery.drawnFrom("t0")).toBeUndefined();
    expect(made).toStrictEqual([]);
    expect(asked).toStrictEqual(["t0"]);
  });

  it("does not ask again for a picture that could not be had, or whose asking failed", async () => {
    const asked: string[] = [];
    const gallery = new Gallery((id) => {
      asked.push(id);
      return id === "gone"
        ? Promise.resolve(undefined)
        : Promise.reject(new Error(id));
    });
    gallery.want("gone");
    gallery.want("broken");
    await settled();
    gallery.release("gone");
    gallery.release("broken");
    gallery.want("gone");
    gallery.want("broken");

    expect(asked).toStrictEqual(["gone", "broken"]);
    expect(gallery.drawnFrom("gone")).toBeUndefined();
    expect(gallery.drawnFrom("broken")).toBeUndefined();
  });

  it("lets every picture go at once, as the shelf leaves the page", async () => {
    const { taking, answer } = held();
    const gallery = new Gallery(taking);
    gallery.want("t0");
    gallery.want("t1");
    await answer("t0", picture);
    await answer("t1", picture);

    gallery.releaseAll();

    expect(revoked).toStrictEqual(["blob:poster-0", "blob:poster-1"]);
  });
});

describe("a poster's place on the page", () => {
  it("asks for its picture as it comes on screen, and lets it go as it leaves", () => {
    let told: (entries: { isIntersecting: boolean }[]) => void = () =>
      undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof told) {
          told = callback;
        }
        observe(): undefined {
          return undefined;
        }
        disconnect = disconnect;
      },
    );
    const want = vi.fn();
    const release = vi.fn();
    const gallery = Object.assign(
      new Gallery(() => Promise.resolve(undefined)),
      {
        want,
        release,
      },
    );
    const stop = onScreen(gallery, "t0")(document.createElement("li"));

    told([{ isIntersecting: true }]);
    told([{ isIntersecting: false }]);
    stop();

    expect(want).toHaveBeenCalledWith("t0");
    expect(release).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
