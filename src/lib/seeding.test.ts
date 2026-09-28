import { describe, expect, it } from "vitest";
import { placeChangedBy } from "./rereading";
import {
  changedBySeeding,
  everySeeding,
  givenForLetting,
  isSeeding,
  lettingGo,
  standingOffer,
} from "./seeding";
import type { Work } from "./work";
import { letGone, letOffer, shared } from "../api/spaces";

/** A record of letting a download go, answered with what it came to. */
const answered = (
  id: string,
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "stop-seeding",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came,
});

describe("what the letting panel asks for", () => {
  it("is the one request it makes, and nothing else", () => {
    expect(everySeeding.every(isSeeding)).toBe(true);
    expect(isSeeding("forget")).toBe(false);
  });

  // Without an offer the request is itself what is read before the yes, and
  // the yes is nothing but the offer's name.
  it("asks what it costs first, and lets go only under the offer it named", () => {
    expect(
      lettingGo.question({ doing: "stop-seeding", download: shared.name }),
    ).toBeUndefined();
    expect(
      givenForLetting({ doing: "stop-seeding", download: shared.name }),
    ).toStrictEqual({ download: shared.name });
    expect(
      givenForLetting({
        doing: "stop-seeding",
        download: shared.name,
        offer: "let-go-4e11",
      }),
    ).toStrictEqual({ download: shared.name, offer: "let-go-4e11" });
  });
});

describe("the offer standing for a yes", () => {
  it("is the newest one read, with the download and the offer's name", () => {
    expect(
      standingOffer([
        answered("1", { kind: "stop-seeding", report: letOffer }),
      ]),
    ).toStrictEqual({
      id: "1",
      download: shared.name,
      offer: "let-go-4e11",
    });
  });

  it("is gone once the download was let go, or where nothing was offered", () => {
    expect(
      standingOffer([answered("2", { kind: "stop-seeding", report: letGone })]),
    ).toBeUndefined();
    expect(standingOffer([answered("3", { kind: "unread" })])).toBeUndefined();
    expect(standingOffer([])).toBeUndefined();
  });
});

describe("what letting go changed", () => {
  it("is the disk, once the client let something go", () => {
    expect(changedBySeeding({ kind: "stop-seeding", report: letGone })).toBe(
      true,
    );
    expect(placeChangedBy({ kind: "stop-seeding", report: letGone })).toBe(
      "storage",
    );
  });

  it("is nothing for an offer, a rehearsal or anything else", () => {
    expect(changedBySeeding({ kind: "stop-seeding", report: letOffer })).toBe(
      false,
    );
    const rehearsed = {
      ...letOffer,
      gone: { name: shared.name, bytes: shared.bytes, rehearsed: true },
    };
    expect(changedBySeeding({ kind: "stop-seeding", report: rehearsed })).toBe(
      false,
    );
    expect(changedBySeeding({ kind: "unread" })).toBe(false);
  });
});
