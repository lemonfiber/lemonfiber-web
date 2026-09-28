import { describe, expect, it } from "vitest";
import {
  everyPairing,
  givenForPair,
  isPairing,
  pairing,
  standingMaterial,
} from "./pairing";
import type { Work } from "./work";
import { material } from "../api/pairings";

/** A record of pairing material asked for, answered with what it came to. */
const answered = (
  id: string,
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "companion-pair",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came,
});

describe("what the pairing panel asks for", () => {
  it("is the one request it makes, and nothing else", () => {
    expect(everyPairing.every(isPairing)).toBe(true);
    expect(isPairing("invite")).toBe(false);
  });

  // The stack names the address, the certificate and itself.
  it("sends nothing, and asks nothing first", () => {
    expect(givenForPair()).toStrictEqual({});
    expect(pairing.question({ doing: "companion-pair" })).toBeUndefined();
  });
});

describe("the material standing on the screen", () => {
  it("is the newest material made", () => {
    const older = answered("1", {
      kind: "pairing",
      report: { ...material, written: "older" },
    });
    expect(
      standingMaterial([
        answered("2", { kind: "pairing", report: material }),
        older,
      ]),
    ).toBe(material);
  });

  it("is nothing while the newest is under way, or came to no material", () => {
    const going: Work = {
      id: "3",
      doing: "companion-pair",
      scoped: false,
      given: {},
      at: "under-way",
      job: "5c63",
    };
    expect(standingMaterial([going])).toBeUndefined();
    expect(
      standingMaterial([answered("4", { kind: "unread" })]),
    ).toBeUndefined();
    expect(standingMaterial([])).toBeUndefined();
  });
});
