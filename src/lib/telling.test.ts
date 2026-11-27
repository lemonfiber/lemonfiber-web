import { describe, expect, it } from "vitest";
import { phoneOf, toggled } from "./telling";
import { kitsTelling } from "../api/hearings";
import * as m from "../paraglide/messages.js";

describe("how a member is told", () => {
  it("switches one way the other way and keeps the rest as they stand", () => {
    expect(toggled(kitsTelling.offered, "phones")).toEqual([
      "family-chat",
      "phones",
    ]);
    expect(toggled(kitsTelling.offered, "family-chat")).toEqual([]);
  });

  it("says whether their own phone is set up to be told", () => {
    expect(phoneOf(kitsTelling)).toBe(m.member_tell_phone());
    expect(phoneOf({ ...kitsTelling, phone: false })).toBe(
      m.member_tell_no_phone(),
    );
  });
});
