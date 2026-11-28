import { describe, expect, it } from "vitest";
import { previewOf, previewSaid } from "./previewed";
import * as m from "../paraglide/messages.js";

const refused = {
  ok: false,
  problem: { kind: "declined", message: "No push endpoint is named iphone" },
} as const;

/** What a revocation's answer carries beside its listing. */
interface Listed {
  readonly rehearsed: boolean;
  readonly revoked: string | null;
}

const answered = (rehearsed: boolean, revoked: string | null) =>
  ({ ok: true, value: { rehearsed, revoked } }) as const;

const byRevoked = (value: Listed): string | null => value.revoked;

describe("what a preview of a revocation answered", () => {
  it("names the one asked about where lemonfiber named it as what saying yes would reach", () => {
    expect(
      previewOf("key-revoke", "home", answered(true, "home"), byRevoked),
    ).toStrictEqual({
      doing: "key-revoke",
      name: "home",
      answer: { ok: true, value: true },
    });
  });

  it("does not name it where lemonfiber named another or none", () => {
    for (const revoked of ["mcp", null]) {
      expect(
        previewOf("key-revoke", "home", answered(true, revoked), byRevoked)
          ?.answer,
      ).toStrictEqual({ ok: true, value: false });
    }
  });

  it("keeps why it could not be read", () => {
    expect(
      previewOf<Listed>("push-endpoint-remove", "iphone", refused, byRevoked),
    ).toStrictEqual({
      doing: "push-endpoint-remove",
      name: "iphone",
      answer: refused,
    });
  });

  it("is no preview where lemonfiber did not answer it as one", () => {
    expect(
      previewOf("key-revoke", "home", answered(false, "home"), byRevoked),
    ).toBeUndefined();
  });
});

describe("what a preview says", () => {
  it("says what saying yes would do to each, and that nothing changed", () => {
    const named = { ok: true, value: true } as const;
    expect(
      previewSaid({ doing: "key-revoke", name: "home", answer: named }),
    ).toStrictEqual({
      problem: undefined,
      line: m.keys_preview_would({ name: "home" }),
    });
    expect(
      previewSaid({ doing: "device-key-revoke", name: "iphone", answer: named })
        .line,
    ).toBe(m.phones_preview_would({ name: "iphone" }));
    expect(
      previewSaid({
        doing: "push-endpoint-remove",
        name: "iphone",
        answer: named,
      }).line,
    ).toBe(m.woken_preview_would({ name: "iphone" }));
  });

  it("says what saying yes would do is not known where lemonfiber did not name it", () => {
    expect(
      previewSaid({
        doing: "key-revoke",
        name: "home",
        answer: { ok: true, value: false },
      }),
    ).toStrictEqual({
      problem: undefined,
      line: m.preview_unnamed({ name: "home" }),
    });
  });

  it("says lemonfiber's sentence where it could not be read, and that the yes still goes ahead", () => {
    expect(
      previewSaid({
        doing: "push-endpoint-remove",
        name: "iphone",
        answer: refused,
      }),
    ).toStrictEqual({
      problem: "No push endpoint is named iphone",
      line: m.preview_unread(),
    });
  });
});
