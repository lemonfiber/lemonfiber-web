import { describe, expect, it } from "vitest";
import {
  changedByFilling,
  choosable,
  filling,
  givenForFill,
  isFilling,
  standingFill,
} from "./filling";
import { contested, chosen, outright, wiring } from "../api/wirings";
import { filled, fillMade, fillOffer, wouldFill } from "../routes/fillings";
import { reclaimedRoom } from "../api/spaces";

describe("choosing which service fills a capability", () => {
  it("is the wiring panel's request, and only that", () => {
    expect(isFilling("wiring-fill")).toBe(true);
    expect(isFilling("space")).toBe(false);
    expect(filling.owns("wiring-fill")).toBe(true);
    expect(
      filling.question({
        doing: "wiring-fill",
        capability: "requests",
        service: "jellyseerr",
        reason: undefined,
      }),
    ).toBeUndefined();
  });

  it("is rehearsed first, writing nothing, with the reason where one was given", () => {
    expect(
      givenForFill({
        doing: "wiring-fill",
        capability: "requests",
        service: "jellyseerr",
        reason: "It knows the household.",
      }),
    ).toStrictEqual({
      capability: "requests",
      service: "jellyseerr",
      reason: "It knows the household.",
      dry_run: true,
    });
    expect(
      givenForFill({
        doing: "wiring-fill",
        capability: "requests",
        service: "jellyseerr",
        reason: undefined,
      }),
    ).toStrictEqual({
      capability: "requests",
      service: "jellyseerr",
      dry_run: true,
    });
  });

  it("is written only under the offer that named itself", () => {
    expect(
      givenForFill({
        doing: "wiring-fill",
        capability: "requests",
        service: "jellyseerr",
        reason: undefined,
        offer: "named",
      }),
    ).toStrictEqual({
      capability: "requests",
      service: "jellyseerr",
      offer: "named",
    });
  });

  it("changes the settings screen once written, and not as a rehearsal", () => {
    expect(changedByFilling({ kind: "substitution", report: filled })).toBe(
      true,
    );
    expect(changedByFilling({ kind: "substitution", report: wouldFill })).toBe(
      false,
    );
    expect(changedByFilling({ kind: "space", report: reclaimedRoom })).toBe(
      false,
    );
  });
});

describe("the offer standing on the screen", () => {
  it("is the newest rehearsal, with what it chose and why", () => {
    expect(standingFill([fillOffer])).toStrictEqual({
      id: fillOffer.id,
      capability: "requests",
      service: "jellyseerr",
      reason: "Jellyseerr knows the household.",
      offer: wouldFill.agreement,
    });
  });

  it("carries no reason where none was kept", () => {
    const unsaid = {
      ...fillOffer,
      came: {
        kind: "substitution" as const,
        report: {
          ...wouldFill,
          substitution: { ...wouldFill.substitution, why: null },
        },
      },
    };
    expect(standingFill([unsaid])?.reason).toBeUndefined();
    const empty = {
      ...unsaid,
      came: {
        kind: "substitution" as const,
        report: {
          ...wouldFill,
          substitution: { ...wouldFill.substitution, why: "" },
        },
      },
    };
    expect(standingFill([empty])?.reason).toBeUndefined();
  });

  it("is none once the choice is written, while it is out, or where nothing was asked", () => {
    expect(standingFill([fillMade, fillOffer])).toBeUndefined();
    expect(
      standingFill([
        {
          id: "99",
          doing: "wiring-fill",
          scoped: false,
          given: {},
          at: "under-way",
          job: "j1",
        },
      ]),
    ).toBeUndefined();
    expect(standingFill([])).toBeUndefined();
  });
});

describe("what there is a choice to make about", () => {
  it("is every contested or chosen capability, once each, with the chosen one first", () => {
    expect(choosable(wiring)).toStrictEqual([
      {
        capability: "requests",
        candidates: ["jellyseerr", "ombi"],
        chosen: undefined,
      },
      {
        capability: "subtitles",
        candidates: ["bazarr", "subgen"],
        chosen: "bazarr",
      },
    ]);
  });

  it("names a capability two links ask for once", () => {
    expect(
      choosable({
        wired: [contested, { ...contested, by: "jellyseerr-two" }, outright],
        unfilled: [],
      }),
    ).toHaveLength(1);
    expect(choosable({ wired: [chosen], unfilled: [] })).toHaveLength(1);
  });
});
