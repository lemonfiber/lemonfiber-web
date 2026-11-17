import { describe, expect, it } from "vitest";
import {
  allowanceOf,
  everyAllowed,
  everyMembership,
  everyPolicy,
  everyRestriction,
  everyUnrated,
  saidOfAccess,
  labelOfPolicy,
  saidOfPolicy,
  shownOf,
  tagOfPerson,
  waitingOn,
  wordOfAllowed,
  wordOfRestriction,
  wordOfUnrated,
} from "./household";
import {
  everyRequestState,
  waitingStates,
  wordOfRequestState,
} from "./standing";
import type {
  Access,
  Allowed,
  Membership,
  Person,
  Policy,
  Restriction,
  Unrated,
} from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * More words from a vocabulary wider than this build's.
 */
const unnamedPolicy = "asks-a-parent" as unknown as Policy;
const unnamedAllowed = "over-quota" as unknown as Allowed;
const unnamedRestriction = "hour-limited" as unknown as Restriction;
const unnamedUnrated = "asks-first" as unknown as Unrated;
const unnamedMembership = "archived" as unknown as Membership;

/** What one account may watch, with whatever this test changes about it. */
const mayWatch = (over: Partial<Access> = {}): Access => ({
  administrator: false,
  age_limit: null,
  disabled: false,
  every_library: true,
  libraries: [],
  rated: null,
  restriction: "unrestricted",
  unrated: "let-through",
  ...over,
});

/** One person in the house, with whatever this test changes about them. */
const someone = (over: Partial<Person> = {}): Person => ({
  name: "Ada",
  claimed: true,
  standing: "active",
  last_seen: 1_787_692_447,
  access: mayWatch(),
  asking: null,
  requests: [],
  to_hand_over: [],
  ...over,
});

describe("what happens to what the house asks for", () => {
  it("names each policy apart where one is chosen from the others", () => {
    expect(new Set(everyPolicy.map(labelOfPolicy)).size).toBe(
      everyPolicy.length,
    );
    expect(labelOfPolicy("sometimes" as Policy)).toBe(m.policy_label_other());
  });

  it.each(everyPolicy)("has a sentence for %s", (policy) => {
    expect(saidOfPolicy(policy)).not.toBe("");
  });

  it("says each of them differently", () => {
    expect(new Set(everyPolicy.map(saidOfPolicy)).size).toBe(
      everyPolicy.length,
    );
  });

  // A policy nobody could read and a house nobody limits are opposite facts,
  // and reporting one as the other would tell an operator their quota was
  // never applied.
  it("says a policy that could not be read was not read", () => {
    expect(saidOfPolicy(null)).toBe(m.household_policy_unread());
    expect(saidOfPolicy(undefined)).toBe(m.household_policy_unread());
    expect(everyPolicy.map(saidOfPolicy)).not.toContain(
      m.household_policy_unread(),
    );
  });

  it("says so where the request service named a policy this build does not know", () => {
    expect(saidOfPolicy(unnamedPolicy)).toBe(m.household_policy_unrecognised());
  });
});

describe("where one person stands against what a period allows", () => {
  it.each(everyAllowed)("has a phrase for %s", (standing) => {
    expect(wordOfAllowed(standing)).not.toBe("");
  });

  it("says each of them differently", () => {
    expect(new Set(everyAllowed.map(wordOfAllowed)).size).toBe(
      everyAllowed.length,
    );
  });

  it("says so where the request service named a standing this build does not know", () => {
    expect(wordOfAllowed(unnamedAllowed)).toBe(m.quota_unrecognised());
    expect(everyAllowed.map(wordOfAllowed)).not.toContain(
      m.quota_unrecognised(),
    );
  });
});

describe("what one person is held to", () => {
  it.each(everyRestriction)("has a phrase for %s", (restriction) => {
    expect(wordOfRestriction(restriction)).not.toBe("");
  });

  it("says each of them differently", () => {
    expect(new Set(everyRestriction.map(wordOfRestriction)).size).toBe(
      everyRestriction.length,
    );
  });

  it("says so where the media server named one this build does not know", () => {
    expect(wordOfRestriction(unnamedRestriction)).toBe(m.held_unrecognised());
    expect(everyRestriction.map(wordOfRestriction)).not.toContain(
      m.held_unrecognised(),
    );
  });
});

describe("what becomes of content nothing has rated", () => {
  it.each(everyUnrated)("has a sentence for %s", (unrated) => {
    expect(wordOfUnrated(unrated)).not.toBe("");
  });

  it("says the two of them differently", () => {
    expect(new Set(everyUnrated.map(wordOfUnrated)).size).toBe(
      everyUnrated.length,
    );
  });

  it("says so where the media server named one this build does not know", () => {
    expect(wordOfUnrated(unnamedUnrated)).toBe(m.unrated_unrecognised());
  });
});

describe("the word beside one person's name", () => {
  // Every standing but an ordinary active account is said, and each apart.
  it("says each standing differently, and nothing for an ordinary active one", () => {
    const said = everyMembership.map((standing) =>
      tagOfPerson(someone({ standing })),
    );

    expect(said).toEqual([
      m.person_not_taken_up(),
      m.person_ran_out(),
      m.person_declined(),
      undefined,
      m.person_switched_off(),
    ]);
  });

  // An account that cannot be signed in to exercises nothing, so what has
  // become of it outranks what it could do.
  it("says an account is switched off, even one that administers", () => {
    expect(
      tagOfPerson(
        someone({
          standing: "suspended",
          access: mayWatch({ administrator: true }),
        }),
      ),
    ).toBe(m.person_switched_off());
  });

  // A lockout leaves every other field as it was, so only the standing says it.
  it("says an account is switched off where nothing else about it does", () => {
    expect(tagOfPerson(someone({ standing: "suspended" }))).toBe(
      m.person_switched_off(),
    );
  });

  it("says an invitation nobody took up is one", () => {
    expect(tagOfPerson(someone({ standing: "invited", claimed: false }))).toBe(
      m.person_not_taken_up(),
    );
  });

  it("says an invitation that ran out did, rather than that it is still open", () => {
    expect(tagOfPerson(someone({ standing: "expired", claimed: false }))).toBe(
      m.person_ran_out(),
    );
  });

  it("says an invitation that was declined was, rather than that it ran out", () => {
    expect(tagOfPerson(someone({ standing: "declined", claimed: false }))).toBe(
      m.person_declined(),
    );
  });

  it("says who administers the media server", () => {
    expect(
      tagOfPerson(someone({ access: mayWatch({ administrator: true }) })),
    ).toBe(m.person_administers());
  });

  it("says nothing about an ordinary account", () => {
    expect(tagOfPerson(someone())).toBeUndefined();
  });

  it("says so where the server named a standing this build does not know", () => {
    expect(tagOfPerson(someone({ standing: unnamedMembership }))).toBe(
      m.person_unrecognised(),
    );
    expect(
      everyMembership.map((standing) => tagOfPerson(someone({ standing }))),
    ).not.toContain(m.person_unrecognised());
  });
});

describe("what one person may watch", () => {
  it("says what they are held to", () => {
    expect(saidOfAccess(someone())).toContain(m.held_unrestricted());
  });

  // A restricted member missing half the library is either this setting or a
  // defect, and an operator cannot tell which from silence.
  it("says what becomes of anything with no rating wherever a limit applies", () => {
    expect(
      saidOfAccess(
        someone({
          access: mayWatch({ restriction: "both", unrated: "held-back" }),
        }),
      ),
    ).toContain(m.unrated_held_back());
  });

  it("leaves it out where nothing is held back from them anyway", () => {
    expect(saidOfAccess(someone())).not.toContain(m.unrated_let_through());
  });

  it("says where nobody has ever arrived as them", () => {
    expect(saidOfAccess(someone({ last_seen: null }))).toContain(
      m.person_never_seen(),
    );
    expect(saidOfAccess(someone())).not.toContain(m.person_never_seen());
  });
});

describe("what one person's period has left", () => {
  it("says where they stand over both counts", () => {
    expect(
      allowanceOf(
        someone({
          asking: {
            films: { used: 4, limit: 5, remaining: 1, period: "a month" },
            television: { used: 3 },
            frees_up: null,
            policy: "within-a-limit",
            standing: "near-quota",
          },
        }),
      ),
    ).toBe(m.quota_near());
  });

  // An unread answer is not an unlimited member, and reporting one as the
  // other would tell an operator their quota was never applied.
  it("says nothing could be read where nothing was", () => {
    expect(allowanceOf(someone())).toBe(m.quota_not_read());
    expect(everyAllowed.map(wordOfAllowed)).not.toContain(m.quota_not_read());
  });
});

describe("one person, as a row sets them out", () => {
  it("carries their name, their tag, what they may watch and where they stand", () => {
    expect(
      shownOf(someone({ access: mayWatch({ administrator: true }) })),
    ).toEqual({
      name: "Ada",
      tag: m.person_administers(),
      prose: m.held_unrestricted(),
      quota: m.quota_not_read(),
    });
  });
});

describe("what is waiting on the operator", () => {
  const asked = someone({
    name: "Kit",
    requests: [
      {
        id: "44",
        title: null,
        media: "film",
        state: "waiting-for-approval",
        waiting_days: 6,
      },
      { id: "43", title: "Some Film", media: "film", state: "failed" },
      { id: "41", title: "Arrival", media: "film", state: "here" },
      { id: "29", title: "An Older Thing", media: null, state: null },
    ],
  });

  it("keeps only what nobody in the house can move on their own", () => {
    const waiting = waitingOn([asked]);
    expect(waiting.map((one) => one.what)).toEqual([
      m.request_a_kind({ media: "film" }),
      "Some Film",
    ]);
  });

  it("takes those two states and no others", () => {
    expect([...waitingStates]).toEqual(["waiting-for-approval", "failed"]);
    for (const state of waitingStates) {
      expect(everyRequestState).toContain(state);
    }
  });

  it("says who asked, and where it stands in their own words", () => {
    const [first] = waitingOn([asked]);
    expect(first?.who).toBe("Kit");
    expect(first?.standing).toBe(wordOfRequestState("waiting-for-approval"));
    expect(first?.kind).toBeUndefined();
  });

  // Only the ones nobody has ruled on carry a count of days, and a request the
  // service could not date carries none.
  it("says how long it has been waiting where the service dated it", () => {
    const waiting = waitingOn([asked]);
    expect(waiting[0]?.since).toBe(m.waiting_days({ days: 6 }));
    expect(waiting[1]?.since).toBeUndefined();
  });

  it("tells one person's requests from another's", () => {
    const both = waitingOn([asked, someone({ name: "Ada" })]);
    expect(new Set(both.map((one) => one.key)).size).toBe(both.length);
    expect(both).toHaveLength(2);
  });

  it("finds nothing in a house that has asked for nothing", () => {
    expect(waitingOn([])).toEqual([]);
  });
});
