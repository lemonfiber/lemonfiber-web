import { describe, expect, it } from "vitest";
import type { Keeping } from "./keeping";
import {
  keepShown,
  keptAt,
  keptShown,
  newlyOf,
  shownOf,
  type Shown,
} from "./seen";
import type { Household } from "./wire";

const member = "b41c9e";

const yours = {
  members: [
    {
      requests: [
        { id: "44", state: "here" },
        { id: "12", state: "getting" },
      ],
    },
  ],
} as unknown as Household;

/** A browser's storage, held in a map. */
function kept(held: Record<string, string> = {}): Keeping {
  const map = new Map(Object.entries(held));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

/** A browser that throws wherever its storage is touched. */
const refusing: Keeping = {
  getItem: () => {
    throw new Error("storage is switched off");
  },
  setItem: () => {
    throw new Error("storage is switched off");
  },
};

describe("which of a member's requests are new", () => {
  it("is where each request stands, by its id", () => {
    const shown = shownOf(yours);
    const requests = yours.members.flatMap((one) => one.requests);
    expect(shown).toEqual(
      Object.fromEntries(requests.map((one) => [one.id, one.state ?? ""])),
    );
    expect(
      shownOf({
        ...yours,
        members: yours.members.map((one) => ({
          ...one,
          requests: one.requests.map((request) => ({
            ...request,
            state: null,
          })),
        })),
      }),
    ).toEqual(Object.fromEntries(requests.map((one) => [one.id, ""])));
  });

  it("marks nothing where this browser showed nothing before", () => {
    expect(newlyOf(undefined, { a: "here" })).toEqual([]);
  });

  it("marks a request that moved, or was not shown before", () => {
    const before: Shown = { a: "getting", b: "here" };
    expect(newlyOf(before, { a: "here", b: "here", c: "getting" })).toEqual([
      "a",
      "c",
    ]);
  });

  it("is kept in this browser alone, and read back", () => {
    const keeping = kept();
    keepShown(keeping, member, { a: "here" });
    expect(keeping.getItem(keptAt(member))).toBe('{"a":"here"}');
    expect(keptShown(keeping, member)).toEqual({ a: "here" });
    expect(keptShown(keeping, "somebody")).toBeUndefined();
  });

  it("reads nothing it cannot stand behind", () => {
    for (const held of ["not json", "[]", "null", '"here"', '{"a":1}']) {
      expect(
        keptShown(kept({ [keptAt(member)]: held }), member),
      ).toBeUndefined();
    }
  });

  it("keeps and reads nothing in a browser that keeps nothing", () => {
    expect(keptShown(undefined, member)).toBeUndefined();
    expect(keptShown(refusing, member)).toBeUndefined();
    expect(() => {
      keepShown(refusing, member, { a: "here" });
    }).not.toThrow();
    expect(() => {
      keepShown(undefined, member, { a: "here" });
    }).not.toThrow();
  });
});
