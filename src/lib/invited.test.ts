import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import {
  householdLines,
  invitationLines,
  type Housed,
  type Invited,
} from "./invited";
import { saidOfPolicy } from "./household";
import {
  claimAt,
  filtering,
  offered,
  reissued,
  wouldOffer,
} from "../api/invitations";
import * as m from "../paraglide/messages.js";

const address = m.came_invite_address({ address: claimAt, hours: "72" });

/** A house that waits on the operator for everything, as a ruling left it. */
const household: Housed = {
  rehearsed: false,
  available: true,
  findings: [],
  members: [],
  policy: "everything-waits",
  allows: "five things a month",
};

/** A house nothing could be read from. */
const unread: Housed = {
  rehearsed: false,
  available: false,
  findings: ["The list of requests could not be read."],
  members: [],
};

describe("what offering an account came to", () => {
  it("says what it would make, where to send them, and on what terms", () => {
    expect(invitationLines(wouldOffer)).toStrictEqual([
      m.came_invite_would({ name: "Sam" }),
      address,
      m.came_invite_limit({ limit: "12 and under" }),
      m.unrated_held_back(),
      filtering,
      m.came_invite_untried(),
    ]);
  });

  it("says the account was made once it was", () => {
    expect(invitationLines(offered)).toStrictEqual([
      m.came_invite_made({ name: "Sam" }),
      address,
      m.came_invite_limit({ limit: "12 and under" }),
      m.unrated_held_back(),
      filtering,
    ]);
  });

  it("says a password was taken off, and where a new one is set", () => {
    expect(invitationLines(reissued)).toStrictEqual([
      m.came_invite_reset({ name: "Kit" }),
      address,
    ]);
  });

  it("says what was found where an account already stood", () => {
    const waiting: Invited = { ...reissued, standing: "waiting" };
    const joined: Invited = { ...reissued, standing: "joined" };
    expect(invitationLines(waiting)[0]).toBe(
      m.came_invite_waiting({ name: "Kit" }),
    );
    expect(invitationLines(joined)[0]).toBe(
      m.came_invite_joined({ name: "Kit" }),
    );
  });

  // A later build may find something this one has no words for, and a line
  // saying so is better than none.
  it("says so where what was found, or linked, is past its words", () => {
    const later = {
      ...reissued,
      standing: "moved",
      linked: "pending",
    } as unknown as Invited;
    expect(invitationLines(later)).toStrictEqual([
      m.came_invite_other({ name: "Kit" }),
      address,
      m.came_invite_link_other(),
    ]);
  });

  it("passes lemonfiber's caution on as it is", () => {
    const caution =
      "The media server is older than the one this was tested on.";
    expect(invitationLines({ ...reissued, caution })).toContain(caution);
  });

  it("says the request service could not be told about them yet", () => {
    expect(invitationLines({ ...reissued, linked: "not-yet" })).toContain(
      m.came_invite_unlinked(),
    );
  });

  it("says what it set no limit on, and a request service not held to it yet", () => {
    const unlimited: Invited = {
      ...offered,
      applied: {
        filtering,
        libraries: [],
        limit: null,
        requesting: "not-yet",
        unrated: "let-through",
      },
    };
    expect(invitationLines(unlimited)).toStrictEqual([
      m.came_invite_made({ name: "Sam" }),
      address,
      m.unrated_let_through(),
      filtering,
      m.came_invite_unheld(),
    ]);
  });

  it("names the offers withdrawn and accounts switched off on the way", () => {
    const tidied: Invited = {
      ...reissued,
      withdrawn: ["Rory", "Lou"],
      suspended: ["Max"],
    };
    expect(invitationLines(tidied)).toStrictEqual([
      m.came_invite_reset({ name: "Kit" }),
      address,
      m.came_invite_withdrawn({ names: "Rory, Lou" }),
      m.came_invite_suspended({ names: "Max" }),
    ]);
  });
});

describe("the household as an act on it left it", () => {
  it("is what a record of a ruling or a limit carries", () => {
    expect(linesOf({ kind: "household", report: household })).toStrictEqual(
      householdLines(household),
    );
    expect(linesOf({ kind: "invitation", report: offered })).toStrictEqual(
      invitationLines(offered),
    );
  });

  it("says the policy, what it allows, and what could not be read", () => {
    expect(
      householdLines({ ...household, findings: ["Kit's list was cut short."] }),
    ).toStrictEqual([
      saidOfPolicy("everything-waits"),
      "five things a month",
      "Kit's list was cut short.",
    ]);
  });

  it("says a policy nobody could read as that", () => {
    expect(householdLines(unread)).toStrictEqual([
      saidOfPolicy(undefined),
      ...unread.findings,
    ]);
  });
});
