import { describe, expect, it } from "vitest";
import {
  changedByMoving,
  givenForMove,
  isMoving,
  moving,
  standingMove,
} from "./moving";
import { adopted, wouldAdopt, wouldReplace } from "../api/moves";
import { filled } from "../api/substitutions";
import type { Work } from "./work";

/** A record of what adopting the media project would come to. */
const adoptOffer: Work = {
  id: "101",
  doing: "migrate-adopt",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "adoption", report: wouldAdopt },
};

/** A record of the media project adopted. */
const adoptMade: Work = {
  ...adoptOffer,
  id: "102",
  given: { confirm: true },
  came: { kind: "adoption", report: adopted },
};

/** A record of what replacing the media project would stop. */
const replaceOffer: Work = {
  id: "103",
  doing: "migrate-replace",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came: { kind: "replacement", report: wouldReplace },
};

describe("acting on a setup already here", () => {
  it("is the survey panel's four requests, and only those", () => {
    expect(isMoving("migrate-replace")).toBe(true);
    expect(isMoving("wiring-fill")).toBe(false);
    expect(moving.owns("migrate-adopt")).toBe(true);
    expect(moving.question({ doing: "migrate-adopt" })).toBeUndefined();
  });

  it("is asked bare first, agreed with a yes, and replacing only under its offer", () => {
    expect(givenForMove({ doing: "migrate-beside" })).toStrictEqual({});
    expect(
      givenForMove({ doing: "migrate-adopt", confirm: true }),
    ).toStrictEqual({ confirm: true });
    expect(
      givenForMove({ doing: "migrate-replace", offer: "named" }),
    ).toStrictEqual({ offer: "named" });
  });

  it("changes what the checks survey once done, and not before", () => {
    expect(changedByMoving({ kind: "adoption", report: adopted })).toBe(true);
    expect(changedByMoving({ kind: "replacement", report: wouldReplace })).toBe(
      false,
    );
    expect(changedByMoving({ kind: "substitution", report: filled })).toBe(
      false,
    );
  });
});

describe("the yes standing on the screen", () => {
  it("is the newest act still to be agreed to", () => {
    expect(standingMove([adoptOffer])).toStrictEqual({
      id: adoptOffer.id,
      doing: "migrate-adopt",
    });
    expect(standingMove([replaceOffer])).toStrictEqual({
      id: replaceOffer.id,
      doing: "migrate-replace",
      offer: wouldReplace.agreement,
    });
  });

  it("is none once done, where a replacement names nothing to agree to, or where nothing was asked", () => {
    expect(standingMove([adoptMade, adoptOffer])).toBeUndefined();
    const nothingToStop = {
      ...replaceOffer,
      came: {
        kind: "replacement" as const,
        report: { ...wouldReplace, agreement: "" },
      },
    };
    expect(standingMove([nothingToStop])).toBeUndefined();
    const mismatched = {
      ...replaceOffer,
      came: {
        kind: "adoption" as const,
        report: { ...adopted, stance: "pending" as const },
      },
    };
    expect(standingMove([mismatched])).toBeUndefined();
    expect(
      standingMove([
        {
          id: "9",
          doing: "migrate-beside",
          scoped: false,
          given: {},
          at: "under-way",
          job: "j",
        },
      ]),
    ).toBeUndefined();
    expect(standingMove([])).toBeUndefined();
  });
});
