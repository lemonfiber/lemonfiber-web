import { describe, expect, it } from "vitest";
import {
  changedTheHousehold,
  everyTending,
  givenForTend,
  isTending,
  offerTyped,
  policyChosen,
  questionOfTend,
  quotaTyped,
  sameTend,
  standingHandoff,
  standingInvitation,
  termsTyped,
  type Terms,
} from "./tending";
import type { Work } from "./work";
import { offered, reissued, wouldOffer } from "../api/invitations";
import { connectedSam, readyForSam } from "../api/handoffs";
import * as m from "../paraglide/messages.js";

/** A record of one asking, answered at once with what it came to. */
const answered = (
  id: string,
  given: Work["given"],
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "invite",
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came,
});

const limited: Terms = { ageLimit: 12, holdUnrated: true };
const open: Terms = { ageLimit: undefined, holdUnrated: true };

describe("what the household panels ask for", () => {
  it("is every request they make, and nothing else", () => {
    expect(everyTending.every(isTending)).toBe(true);
    expect(isTending("up")).toBe(false);
  });
});

describe("an offer as typed", () => {
  it("takes an empty age as no limit", () => {
    expect(termsTyped(" ", true)).toStrictEqual(open);
  });

  it("takes a whole age as the limit, with what has no rating", () => {
    expect(termsTyped("12", false)).toStrictEqual({
      ageLimit: 12,
      holdUnrated: false,
    });
  });

  it("is nothing where the age typed is not a whole number", () => {
    expect(termsTyped("twelve", true)).toBeUndefined();
    expect(termsTyped("0", true)).toBeUndefined();
  });

  it("names the person, trimmed, on the terms typed", () => {
    expect(offerTyped(" Sam ", limited)).toStrictEqual({
      doing: "invite",
      name: "Sam",
      terms: limited,
    });
  });

  it("is nothing where it names nobody, or its terms are not whole", () => {
    expect(offerTyped("  ", limited)).toBeUndefined();
    expect(offerTyped("Sam", undefined)).toBeUndefined();
  });
});

describe("limits as typed", () => {
  it("chooses the policy a value names, or keeps the one given", () => {
    expect(policyChosen("within-a-limit", "trusted")).toBe("within-a-limit");
    expect(policyChosen("sometimes", "trusted")).toBe("trusted");
    expect(policyChosen(null, "everything-waits")).toBe("everything-waits");
  });

  it("takes both numbers as a limit", () => {
    expect(quotaTyped("5", " 30 ")).toStrictEqual({
      quota: { requests: 5, days: 30 },
    });
  });

  it("takes neither as no limit named", () => {
    expect(quotaTyped("", " ")).toStrictEqual({ quota: undefined });
  });

  // Half a limit is a figure over no period, and lemonfiber refuses it.
  it("is nothing where only one is typed, or either is not a count", () => {
    expect(quotaTyped("5", "")).toBeUndefined();
    expect(quotaTyped("", "30")).toBeUndefined();
    expect(quotaTyped("five", "30")).toBeUndefined();
  });
});

describe("what each asking sends", () => {
  it("asks what an offer would make, naming the limit where there is one", () => {
    expect(
      givenForTend({ doing: "invite", name: "Sam", terms: limited }),
    ).toStrictEqual({ name: "Sam", age_limit: 12, unrated: "block" });
    expect(
      givenForTend({
        doing: "invite",
        name: "Sam",
        terms: { ageLimit: 15, holdUnrated: false },
      }),
    ).toStrictEqual({ name: "Sam", age_limit: 15, unrated: "allow" });
  });

  // With no limit there is nothing for a word about unrated content to qualify.
  it("sends the name alone for an offer with no limit", () => {
    expect(
      givenForTend({ doing: "invite", name: "Sam", terms: open }),
    ).toStrictEqual({ name: "Sam" });
  });

  it("makes the offer on a yes, on the same terms", () => {
    expect(
      givenForTend({
        doing: "invite",
        name: "Sam",
        terms: limited,
        confirm: true,
      }),
    ).toStrictEqual({
      name: "Sam",
      age_limit: 12,
      unrated: "block",
      confirm: true,
    });
  });

  it("names the person a device is handed to", () => {
    expect(
      givenForTend({ doing: "household-handoff", name: "Sam" }),
    ).toStrictEqual({ name: "Sam" });
  });

  it("names the person a new password is for", () => {
    expect(givenForTend({ doing: "reissue", name: "Kit" })).toStrictEqual({
      name: "Kit",
    });
  });

  it("says what the house may ask for, with a limit where one is set", () => {
    expect(
      givenForTend({
        doing: "household-allow",
        limits: {
          name: undefined,
          policy: "within-a-limit",
          quota: { requests: 5, days: 30 },
        },
      }),
    ).toStrictEqual({ policy: "within-a-limit", requests: 5, days: 30 });
  });

  it("says what one person may ask for", () => {
    expect(
      givenForTend({
        doing: "household-allow",
        limits: { name: "Kit", policy: "everything-waits", quota: undefined },
      }),
    ).toStrictEqual({ name: "Kit", policy: "everything-waits" });
  });

  it("names the request ruled on, and why one is turned down", () => {
    expect(
      givenForTend({
        doing: "household-approve",
        request: 44,
        title: "A film",
      }),
    ).toStrictEqual({ request: 44 });
    expect(
      givenForTend({
        doing: "household-decline",
        request: 44,
        title: "A film",
        reason: "We have it on disc.",
      }),
    ).toStrictEqual({ request: 44, reason: "We have it on disc." });
  });
});

describe("what is asked before anything is sent", () => {
  // Nothing comes back to read before a password is taken off.
  it("asks before a new password, naming who it is for", () => {
    expect(questionOfTend({ doing: "reissue", name: "Kit" })).toStrictEqual({
      eyebrow: m.confirm_mend_eyebrow(),
      title: m.confirm_reissue_title({ name: "Kit" }),
      prose: m.confirm_reissue_prose(),
      yes: m.action_reissue_yes(),
    });
  });

  it("asks nothing before an offer is read, a limit or a ruling", () => {
    expect(
      questionOfTend({ doing: "invite", name: "Sam", terms: open }),
    ).toBeUndefined();
    expect(
      questionOfTend({
        doing: "household-approve",
        request: 44,
        title: "A film",
      }),
    ).toBeUndefined();
  });

  it("takes a yes only for the person it asked about", () => {
    const kit = { doing: "reissue", name: "Kit" } as const;
    expect(sameTend(kit, kit)).toBe(true);
    expect(sameTend(kit, { doing: "reissue", name: "Ada" })).toBe(false);
    expect(sameTend(undefined, kit)).toBe(false);
    expect(
      sameTend(
        { doing: "household-approve", request: 44, title: "A film" },
        { doing: "household-approve", request: 41, title: "Andor" },
      ),
    ).toBe(true);
    expect(sameTend(kit, { doing: "invite", name: "Kit", terms: open })).toBe(
      false,
    );
  });
});

describe("whether the household has changed", () => {
  it("has once an account was offered, or anything was ruled or limited", () => {
    expect(changedTheHousehold({ kind: "invitation", report: offered })).toBe(
      true,
    );
    expect(
      changedTheHousehold({
        kind: "household",
        report: {
          rehearsed: false,
          available: true,
          findings: [],
          members: [],
        },
      }),
    ).toBe(true);
  });

  it("has not while an offer is only read", () => {
    expect(
      changedTheHousehold({ kind: "invitation", report: wouldOffer }),
    ).toBe(false);
    expect(changedTheHousehold({ kind: "unread" })).toBe(false);
  });
});

describe("the offer standing on the screen", () => {
  const read = answered(
    "3",
    { name: "Sam", age_limit: 12, unrated: "block" },
    { kind: "invitation", report: wouldOffer },
  );

  it("is the newest offer read, with the terms it was read on", () => {
    expect(standingInvitation([read])).toStrictEqual({
      id: "3",
      name: "Sam",
      terms: limited,
    });
  });

  it("carries a word let through where that was asked", () => {
    const letting = answered(
      "4",
      { name: "Sam", age_limit: 12, unrated: "allow" },
      { kind: "invitation", report: wouldOffer },
    );
    expect(standingInvitation([letting])?.terms).toStrictEqual({
      ageLimit: 12,
      holdUnrated: false,
    });
  });

  it("is gone once the offer has been made", () => {
    const made = answered(
      "5",
      { name: "Sam", confirm: true },
      { kind: "invitation", report: offered },
    );
    expect(standingInvitation([made, read])).toBeUndefined();
  });

  it("is nothing while the newest is under way, or came to no invitation", () => {
    const going: Work = {
      id: "6",
      doing: "invite",
      scoped: false,
      given: { name: "Sam" },
      at: "under-way",
      job: "5c63",
    };
    const unread = answered("7", { name: "Sam" }, { kind: "unread" });
    expect(standingInvitation([going, read])).toBeUndefined();
    expect(standingInvitation([unread])).toBeUndefined();
    expect(standingInvitation([])).toBeUndefined();
  });

  it("is about offers only, not a new password", () => {
    const reset: Work = {
      ...answered(
        "8",
        { name: "Kit" },
        { kind: "invitation", report: reissued },
      ),
      doing: "reissue",
    };
    expect(standingInvitation([reset])).toBeUndefined();
  });
});

describe("the hand-off standing under one person", () => {
  /** A hand-off asked for one person, answered with where it stands. */
  const handed = (
    id: string,
    name: string,
    came: Extract<Work, { at: "done" }>["came"],
  ): Work => ({
    ...answered(id, { name }, came),
    doing: "household-handoff",
  });

  it("is the newest one answered for them", () => {
    const first = handed("1", "Sam", { kind: "handoff", report: readyForSam });
    const later = handed("2", "Sam", {
      kind: "handoff",
      report: connectedSam,
    });
    expect(standingHandoff([later, first], "Sam")).toBe(connectedSam);
  });

  it("passes over somebody else's, and anything else asked", () => {
    const kit = handed("3", "Kit", { kind: "handoff", report: readyForSam });
    const sam = handed("4", "Sam", { kind: "handoff", report: readyForSam });
    const reset: Work = {
      ...answered(
        "5",
        { name: "Sam" },
        { kind: "invitation", report: reissued },
      ),
      doing: "reissue",
    };
    expect(standingHandoff([kit, reset, sam], "Sam")).toBe(readyForSam);
    expect(standingHandoff([kit], "Sam")).toBeUndefined();
    expect(standingHandoff([], "Sam")).toBeUndefined();
  });

  it("is nothing while the newest is under way, or came to no hand-off", () => {
    const sam = handed("6", "Sam", { kind: "handoff", report: readyForSam });
    const going: Work = {
      id: "7",
      doing: "household-handoff",
      scoped: false,
      given: { name: "Sam" },
      at: "under-way",
      job: "5c63",
    };
    const unread = handed("8", "Sam", { kind: "unread" });
    expect(standingHandoff([going, sam], "Sam")).toBeUndefined();
    expect(standingHandoff([unread, sam], "Sam")).toBeUndefined();
  });
});
