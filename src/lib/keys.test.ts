import { describe, expect, it } from "vitest";
import { whenOf } from "./history";
import {
  everyPurpose,
  keyLines,
  mintedLines,
  purposeChosen,
  scopeChosen,
  stateLine,
  wordOfPurpose,
  type Listed,
  type Purpose,
} from "./keys";
import { home, kits, made, madeLocal, old } from "../api/keylists";
import * as m from "../paraglide/messages.js";

describe("one integration key", () => {
  it("says what it admits, what it is for, where it stands, and when it was minted and used", () => {
    expect(keyLines(home)).toStrictEqual([
      m.keys_scope({ scope: "read" }),
      m.keys_purpose({ purpose: m.keys_purpose_home_assistant() }),
      m.keys_active(),
      m.keys_minted({ when: whenOf("1790000000") }),
      m.keys_used({ when: whenOf("1790003600") }),
    ]);
  });

  it("says a member minted it, and that it was never used", () => {
    expect(keyLines(kits)).toContain(m.keys_member_minted());
    expect(keyLines(kits)).toContain(m.keys_never_used());
  });

  it("says when it was revoked", () => {
    expect(keyLines(old)).toContain(
      m.keys_revoked_at({ when: whenOf("1789000000") }),
    );
    expect(keyLines(old)).toContain(m.keys_never_used());
  });

  it("has a word for every state and purpose, and for one it does not know", () => {
    expect(stateLine("orphaned")).toBe(m.keys_orphaned());
    expect(stateLine("unconfirmed")).toBe(m.keys_unconfirmed());
    expect(stateLine("revoked")).toBe(m.keys_revoked());
    expect(stateLine("lost" as Listed["state"])).toBe(m.keys_state_other());
    expect(everyPurpose.map((one) => wordOfPurpose(one))).toStrictEqual([
      m.keys_purpose_home_assistant(),
      m.keys_purpose_mcp(),
      m.keys_purpose_other(),
    ]);
    expect(wordOfPurpose("bot" as Purpose)).toBe(m.keys_purpose_unknown());
  });
});

describe("a key just minted", () => {
  it("says the pin and the address a program needs beside the secret", () => {
    expect(mintedLines(made)).toStrictEqual([
      m.keys_scope({ scope: "read" }),
      m.keys_purpose({ purpose: m.keys_purpose_home_assistant() }),
      m.keys_pin({ pin: "sha256:ab12" }),
      m.keys_address({ address: "192.0.2.10:7777" }),
    ]);
  });

  it("says lemonfiber's caution where there is no address yet", () => {
    expect(mintedLines(madeLocal)).toStrictEqual([
      m.keys_scope({ scope: "act" }),
      m.keys_purpose({ purpose: m.keys_purpose_mcp() }),
      madeLocal.caution,
    ]);
  });
});

describe("what is chosen to mint", () => {
  it("is the scope or purpose a value names, or the one in force where it names none", () => {
    expect(scopeChosen("member", "read")).toBe("member");
    expect(scopeChosen("admin", "act")).toBe("act");
    expect(purposeChosen("mcp", "other")).toBe("mcp");
    expect(purposeChosen("bot", "other")).toBe("other");
  });
});
