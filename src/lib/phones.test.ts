import { describe, expect, it } from "vitest";
import { whenOf } from "./instant";
import {
  backingLine,
  phoneLines,
  revokedLine,
  standing,
  type Phone,
} from "./phones";
import { iphone, phones, pixel, tablet, unpaired } from "../api/keylists";
import * as m from "../paraglide/messages.js";

describe("one phone's hardware key", () => {
  it("says the app that made it, its fingerprint, where it is kept, and when it was registered and used", () => {
    expect(phoneLines(pixel)).toStrictEqual([
      m.phones_app({ app: pixel.app }),
      m.phones_fingerprint({ fingerprint: pixel.fingerprint }),
      m.phones_strongbox(),
      m.phones_registered({ when: whenOf(1_790_000_000) }),
      m.phones_used({ when: whenOf(1_790_007_200) }),
    ]);
  });

  it("says it has proved no mint yet, and when it was revoked", () => {
    expect(phoneLines(iphone)).toContain(m.phones_never_used());
    expect(phoneLines(tablet)).toContain(m.phones_never_used());
    expect(phoneLines(tablet)).toContain(
      m.keys_revoked_at({ when: whenOf(1_789_000_000) }),
    );
    expect(phoneLines(iphone)).not.toContain(
      m.keys_revoked_at({ when: whenOf(1_789_000_000) }),
    );
  });

  it("says where each backing keeps it, and a backing it has no word for", () => {
    expect(backingLine("strongbox")).toBe(m.phones_strongbox());
    expect(backingLine("enclave")).toBe(m.phones_enclave());
    expect(backingLine("tee")).toBe(m.phones_tee());
    expect(backingLine("vault" as Phone["backing"])).toBe(
      m.phones_backing_other(),
    );
  });

  it("may be revoked only while it stands", () => {
    expect(standing(pixel)).toBe(true);
    expect(standing({ ...pixel, revoked: null })).toBe(true);
    expect(standing(tablet)).toBe(false);
  });
});

describe("what a revoke came to", () => {
  it("names the phone the answer says was revoked, and nothing otherwise", () => {
    expect(revokedLine(unpaired)).toBe(m.phones_revoked({ name: "iphone" }));
    expect(revokedLine(phones)).toBeUndefined();
    expect(revokedLine({ ...phones, revoked: null })).toBeUndefined();
    expect(revokedLine(undefined)).toBeUndefined();
  });
});
