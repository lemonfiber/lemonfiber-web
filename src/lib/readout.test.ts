import { describe, expect, it } from "vitest";
import { given, lasting, toldBy } from "./readout";
import * as m from "../paraglide/messages.js";

describe("a reading told as lines", () => {
  it("is nothing until it answers", () => {
    expect(
      toldBy(undefined, () => ({ lines: [], entries: [] })),
    ).toBeUndefined();
  });

  it("is told where it was read, and says why where it was not", () => {
    expect(
      toldBy({ ok: true, value: 3 }, (n) => ({
        lines: [String(n)],
        entries: [],
      })),
    ).toStrictEqual({ ok: true, value: { lines: ["3"], entries: [] } });
    const refused = {
      ok: false as const,
      problem: { kind: "refused" as const, message: "No." },
    };
    expect(toldBy(refused, () => ({ lines: [], entries: [] }))).toBe(refused);
  });

  it("keeps a value lemonfiber gave, and not one it left out", () => {
    expect(given(0)).toBe(true);
    expect(given(null)).toBe(false);
    expect(given(undefined)).toBe(false);
  });
});

describe("a length of time", () => {
  it("is said in its largest whole unit", () => {
    expect(lasting(7200)).toBe(m.lasting_hours({ count: 2 }));
    expect(lasting(600)).toBe(m.lasting_minutes({ count: 10 }));
    expect(lasting(90)).toBe(m.lasting_seconds({ count: 90 }));
    expect(lasting(0)).toBe(m.lasting_seconds({ count: 0 }));
  });
});
