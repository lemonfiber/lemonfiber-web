import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { comparableForm, pairingLines } from "./paired";
import {
  material,
  reachAt,
  replacing,
  zeroes,
  zeroesForm,
} from "../api/pairings";
import * as m from "../paraglide/messages.js";

describe("the short form of a fingerprint", () => {
  // The two the requirement states, so every surface that shows one shows the
  // same one.
  it("is the one the spec states for a fingerprint of noughts", async () => {
    expect(await comparableForm(zeroes)).toBe(zeroesForm);
  });

  it("is the one the spec states for a fingerprint of fs", async () => {
    expect(await comparableForm("f".repeat(64))).toBe("Z9JL-Q3PK-BZ6M-HRQZ");
  });

  it("is worked out over the fingerprint in lower case", async () => {
    expect(await comparableForm("F".repeat(64))).toBe("Z9JL-Q3PK-BZ6M-HRQZ");
  });
});

describe("what making pairing material came to", () => {
  it("says where the phone reaches, until when, and what would undo it", () => {
    expect(pairingLines(material)).toStrictEqual([
      m.came_pairing_address({ address: reachAt }),
      m.came_pairing_until({ until: material.until }),
      replacing,
    ]);
  });

  it("passes lemonfiber's caution about the address on as it is", () => {
    const caution = "This address changes when the router hands out another.";
    expect(pairingLines({ ...material, caution })).toContain(caution);
  });

  it("is what a record of it carries", () => {
    expect(linesOf({ kind: "pairing", report: material })).toStrictEqual(
      pairingLines(material),
    );
  });
});
