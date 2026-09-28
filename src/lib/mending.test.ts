import { describe, expect, it } from "vitest";
import {
  changedTheChecks,
  everyMending,
  givenForMend,
  isMending,
  questionOfMend,
  sameMend,
  standingOffer,
} from "./mending";
import type { Checked } from "./came";
import type { Work } from "./work";
import { agreement, carried, offer, undone } from "../api/reports";
import * as m from "../paraglide/messages.js";

/** A run of the checks in which nothing was found. */
const allWell: Checked = { overall: "healthy", findings: [] };

/** A record of asking what can be put right, with the offer it came back with. */
const offered: Work = {
  id: "11",
  doing: "repair",
  scoped: false,
  given: {},
  at: "done",
  job: "5c63e1ab7d0e9f24",
  came: { kind: "repair", report: offer },
};

describe("what the checks screen can ask for", () => {
  it("offers seeing what can be put right before anything that changes it", () => {
    expect(everyMending[0]).toBe("repair");
  });

  it.each(everyMending)("counts %s as the checks screen's", (doing) => {
    expect(isMending(doing)).toBe(true);
  });

  it("counts nothing the overview asks for as the checks screen's", () => {
    expect(isMending("up")).toBe(false);
  });
});

describe("what goes with each asking", () => {
  // Seeing the offer is the command with nothing agreed, and a field it has
  // nowhere to put would be refused rather than dropped.
  it("sends nothing at all for the offer", () => {
    expect(givenForMend({ doing: "repair" })).toStrictEqual({});
  });

  it("names the offer an agreement was read in, and what was chosen from it", () => {
    expect(
      givenForMend({
        doing: "repair",
        offer: agreement,
        agreed: ["services.health"],
      }),
    ).toStrictEqual({
      confirm: true,
      offer: agreement,
      agreed: ["services.health"],
    });
  });

  it("asks for the checks that disturb by the word that widens them", () => {
    expect(givenForMend({ doing: "diagnose" })).toStrictEqual({
      disruptive: true,
    });
  });

  it("names the warning being accepted", () => {
    expect(
      givenForMend({
        doing: "accept",
        check: "storage.headroom",
        title: "Room",
      }),
    ).toStrictEqual({ check: "storage.headroom" });
  });

  // Which repair was last is lemonfiber's to decide.
  it("names nothing for putting the last repair back", () => {
    expect(givenForMend({ doing: "undo" })).toStrictEqual({});
  });
});

describe("what is asked before anything is sent", () => {
  // The offer is the thing to read before agreeing, so asking about it first
  // would be a question in front of the answer.
  it("asks nothing before asking what can be put right", () => {
    expect(questionOfMend({ doing: "repair" })).toBeUndefined();
  });

  it("asks before the checks that take the tunnel away", () => {
    expect(questionOfMend({ doing: "diagnose" })?.title).toBe(
      m.confirm_diagnose_title(),
    );
  });

  it("names the warning it is asking about", () => {
    expect(
      questionOfMend({
        doing: "accept",
        check: "storage.headroom",
        title: "Room",
      })?.title,
    ).toBe(m.confirm_accept_title({ check: "Room" }));
  });

  it("asks before putting the last repair back", () => {
    expect(questionOfMend({ doing: "undo" })?.yes).toBe(m.action_undo_yes());
  });
});

describe("whether a yes is a yes to what was asked", () => {
  it("is not, where nothing was asked", () => {
    expect(sameMend(undefined, { doing: "undo" })).toBe(false);
  });

  it("is not, where something else was asked", () => {
    expect(sameMend({ doing: "diagnose" }, { doing: "undo" })).toBe(false);
  });

  it("is, where the same thing was asked", () => {
    expect(sameMend({ doing: "undo" }, { doing: "undo" })).toBe(true);
  });

  // Two warnings are two questions, and a yes to one is not a yes to both.
  it("is not, where a different warning was asked about", () => {
    expect(
      sameMend(
        { doing: "accept", check: "a", title: "A" },
        { doing: "accept", check: "b", title: "B" },
      ),
    ).toBe(false);
  });

  it("is, where the same warning was asked about", () => {
    expect(
      sameMend(
        { doing: "accept", check: "a", title: "A" },
        { doing: "accept", check: "a", title: "A" },
      ),
    ).toBe(true);
  });
});

describe("what changes what the checks would find", () => {
  it("counts a repair carried out", () => {
    expect(changedTheChecks({ kind: "repair", report: carried })).toBe(true);
  });

  it("counts a repair put back", () => {
    expect(changedTheChecks({ kind: "undo", report: undone })).toBe(true);
  });

  it("does not count an offer, which changes nothing", () => {
    expect(changedTheChecks({ kind: "repair", report: offer })).toBe(false);
  });

  it("does not count a run of the checks, which is a finding itself", () => {
    expect(changedTheChecks({ kind: "doctor", report: allWell })).toBe(false);
  });
});

describe("the offer standing on the screen", () => {
  const record = (over: Readonly<Record<string, unknown>>): Work => ({
    ...offered,
    ...over,
  });

  it("is the offer the newest repair came back with", () => {
    expect(standingOffer([offered])).toStrictEqual({
      id: offered.id,
      agreement,
      offered: offer.offered,
    });
  });

  it("is nothing where nothing was asked", () => {
    expect(standingOffer([])).toBeUndefined();
  });

  // Once an agreement is on its way, the offer it named is no longer one
  // anybody can agree to.
  it("is nothing once a newer repair is under way", () => {
    expect(
      standingOffer([record({ id: "13", at: "under-way", job: "j" }), offered]),
    ).toBeUndefined();
  });

  it("is nothing once the offer has been answered", () => {
    expect(
      standingOffer([
        record({ id: "13", came: { kind: "repair", report: carried } }),
        offered,
      ]),
    ).toBeUndefined();
  });

  it("is nothing where there was nothing to put right", () => {
    expect(
      standingOffer([
        record({
          came: { kind: "repair", report: { ...offer, offered: [] } },
        }),
      ]),
    ).toBeUndefined();
  });

  it("is nothing where the repair came back as something else", () => {
    expect(
      standingOffer([record({ came: { kind: "unread" } })]),
    ).toBeUndefined();
  });
});
