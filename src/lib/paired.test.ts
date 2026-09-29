import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { pairingLines } from "./paired";
import { material, reachAt, replacing } from "../api/pairings";
import * as m from "../paraglide/messages.js";

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
