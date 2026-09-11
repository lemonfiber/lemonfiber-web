import { describe, expect, it } from "vitest";
import {
  allowanceOf,
  everyAllowed,
  everyPolicy,
  everyRequestState,
  everyRestriction,
  everyUnrated,
  kindOfRequest,
  nameOfRequest,
  saidOfAccess,
  saidOfPolicy,
  shownOf,
  standingOf,
  tagOfPerson,
  waitingOn,
  waitingStates,
  wordOfAllowed,
  wordOfRequestState,
  wordOfRestriction,
  wordOfUnrated,
} from "./household";
import type {
  Access,
  Allowed,
  Person,
  Policy,
  RequestState,
  Restriction,
  Unrated,
} from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * A word from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name and the version
 * gate still passes. There is no way to write one but to say so.
 */
const unnamedState = "held-for-review" as unknown as RequestState;

describe("where a request stands", () => {
  it.each(everyRequestState)("has a word for %s", (state) => {
    expect(wordOfRequestState(state)).not.toBe("");
  });

  it("says each of them differently", () => {
    const said = new Set(everyRequestState.map(wordOfRequestState));
    expect(said.size).toBe(everyRequestState.length);
  });

  it("reads a request's own state", () => {
    expect(
      standingOf({ id: 1, title: "Arrival", media: "film", state: "here" }),
    ).toBe(m.request_state_here());
  });

  // A state this build has no word for is said plainly rather than guessed into
  // the nearest word it does have.
  it("says so where the request service named a state this build does not know", () => {
    expect(
      standingOf({ id: 2, title: "Arrival", media: "film", state: null }),
    ).toBe(m.request_state_unrecognised());
    expect(standingOf({ id: 3 })).toBe(m.request_state_unrecognised());
  });

  // The wire version is one number and the vocabulary under it grows, so the
  // service can name a state that is not absent and is not one of the seven
  // either. Falling off the end of the switch would leave the cell blank.
  it("says the same where the state is a word rather than nothing", () => {
    expect(
      standingOf({
        id: 4,
        title: "Arrival",
        media: "film",
        state: unnamedState,
      }),
    ).toBe(m.request_state_unrecognised());
    expect(everyRequestState.map(wordOfRequestState)).not.toContain(
      m.request_state_unrecognised(),
    );
  });
});

describe("what to call a request", () => {
  it("uses the title where a service has been told one", () => {
    expect(nameOfRequest({ id: 5, title: "Andor", media: "series" })).toBe(
      "Andor",
    );
  });

  // A request no service holds yet has no title to show, so naming it by what
  // it is keeps the row honest.
  it("names an untitled request by what it is", () => {
    expect(nameOfRequest({ id: 6, title: null, media: "film" })).toBe(
      m.request_a_kind({ media: "film" }),
    );
  });

  it("names one that is neither by neither", () => {
    expect(nameOfRequest({ id: 7, title: null, media: null })).toBe(
      m.request_unnamed(),
    );
  });
});

describe("the kind set beside the name", () => {
  it("says the kind where the name is a title", () => {
    expect(kindOfRequest({ id: 8, title: "Andor", media: "series" })).toBe(
      "series",
    );
  });

  // The name is already the kind, and saying it twice says nothing.
  it("says nothing where the name is already the kind", () => {
    expect(
      kindOfRequest({ id: 9, title: null, media: "film" }),
    ).toBeUndefined();
  });

  it("says nothing where the request service named no kind", () => {
    expect(
      kindOfRequest({ id: 10, title: "Andor", media: null }),
    ).toBeUndefined();
  });
});

/**
 * More words from a vocabulary wider than this build's.
 */
const unnamedPolicy = "asks-a-parent" as unknown as Policy;
const unnamedAllowed = "over-quota" as unknown as Allowed;
const unnamedRestriction = "hour-limited" as unknown as Restriction;
const unnamedUnrated = "asks-first" as unknown as Unrated;

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
  last_seen: "2026-08-25T21:14:07Z",
  access: mayWatch(),
  asking: null,
  requests: [],
  to_hand_over: [],
  ...over,
});

describe("what happens to what the house asks for", () => {
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
  // An account that cannot be signed in to exercises nothing, so what has
  // become of it outranks what it could do.
  it("says an account is switched off before it says anything else", () => {
    expect(
      tagOfPerson(
        someone({ access: mayWatch({ disabled: true, administrator: true }) }),
      ),
    ).toBe(m.person_switched_off());
  });

  it("says an invitation nobody took up is one", () => {
    expect(tagOfPerson(someone({ claimed: false }))).toBe(
      m.person_not_taken_up(),
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
        id: 44,
        title: null,
        media: "film",
        state: "waiting-for-approval",
        waiting_days: 6,
      },
      { id: 43, title: "Some Film", media: "film", state: "failed" },
      { id: 41, title: "Arrival", media: "film", state: "here" },
      { id: 29, title: "An Older Thing", media: null, state: null },
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
