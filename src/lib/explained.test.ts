import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  browserKeeping,
  Explained,
  KEPT,
  type Keeping,
} from "./explained.svelte";
import { seed, vocabulary } from "../api/vocabularies";

/** A browser's storage, held in a map. */
function kept(held: Record<string, string> = {}): Keeping & {
  readonly held: Record<string, string>;
} {
  return {
    held,
    getItem: (key) => held[key] ?? null,
    setItem: (key, value) => {
      held[key] = value;
    },
  };
}

/** A browser that keeps nothing, and says so by throwing. */
const refusing: Keeping = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

describe("whether this browser explains terms", () => {
  it("does until the reader says otherwise, and keeps what they said", () => {
    const keeping = kept();
    const explained = new Explained(keeping);
    expect(explained.on).toBe(true);

    explained.on = false;
    expect(explained.on).toBe(false);
    expect(keeping.held[KEPT]).toBe("off");
    expect(new Explained(keeping).on).toBe(false);

    explained.on = true;
    expect(new Explained(keeping).on).toBe(true);
  });

  it("starts on, and honours a choice, where the browser keeps nothing", () => {
    const explained = new Explained(refusing);
    expect(explained.on).toBe(true);
    explained.on = false;
    expect(explained.on).toBe(false);
    expect(new Explained().on).toBe(true);
  });

  it("is kept in this browser's storage, or nowhere where reaching it throws", () => {
    expect(browserKeeping()).toBe(globalThis.localStorage);
    const held = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("denied");
      },
    });
    try {
      expect(browserKeeping()).toBeUndefined();
    } finally {
      if (held !== undefined) {
        Object.defineProperty(globalThis, "localStorage", held);
      }
    }
  });
});

describe("what terms are explained from", () => {
  it("finds nothing until the glossary is held, or where it could not be read", () => {
    const explained = new Explained();
    expect(explained.finder).toBeUndefined();
    explained.hold({ ok: true, value: vocabulary });
    expect(explained.finder?.filed.get("seeding")).toBe("seed");
    explained.hold({ ok: false, problem: unreachable() });
    expect(explained.finder).toBeUndefined();
  });

  it("answers a word from the glossary, and a word it does not hold as missing", async () => {
    const explained = new Explained();
    explained.hold({ ok: true, value: vocabulary });
    expect(await explained.explain("seed")).toStrictEqual({
      ok: true,
      value: seed,
    });
    const absent = await explained.explain("nonsense");
    expect(absent.ok).toBe(false);
    expect(!absent.ok && absent.problem.kind).toBe("missing");
  });
});
