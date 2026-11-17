import { describe, expect, it } from "vitest";
import {
  askingWasRead,
  everyRequestState,
  kindOfRequest,
  nameOfRequest,
  standingOf,
  wordOfRequestState,
} from "./standing";
import { everyPolicy } from "./household";
import type { RequestState } from "./wire";
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
      standingOf({ id: "1", title: "Arrival", media: "film", state: "here" }),
    ).toBe(m.request_state_here());
  });

  // A state this build has no word for is said plainly rather than guessed into
  // the nearest word it does have.
  it("says so where the request service named a state this build does not know", () => {
    expect(
      standingOf({ id: "2", title: "Arrival", media: "film", state: null }),
    ).toBe(m.request_state_unrecognised());
    expect(standingOf({ id: "3" })).toBe(m.request_state_unrecognised());
  });

  // The wire version is one number and the vocabulary under it grows, so the
  // service can name a state that is not absent and is not one of the seven
  // either. Falling off the end of the switch would leave the cell blank.
  it("says the same where the state is a word rather than nothing", () => {
    expect(
      standingOf({
        id: "4",
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
    expect(nameOfRequest({ id: "5", title: "Andor", media: "series" })).toBe(
      "Andor",
    );
  });

  // A request no service holds yet has no title to show, so naming it by what
  // it is keeps the row honest.
  it("names an untitled request by what it is", () => {
    expect(nameOfRequest({ id: "6", title: null, media: "film" })).toBe(
      m.request_a_kind({ media: "film" }),
    );
  });

  it("names one that is neither by neither", () => {
    expect(nameOfRequest({ id: "7", title: null, media: null })).toBe(
      m.request_unnamed(),
    );
  });
});

describe("the kind set beside the name", () => {
  it("says the kind where the name is a title", () => {
    expect(kindOfRequest({ id: "8", title: "Andor", media: "series" })).toBe(
      "series",
    );
  });

  // The name is already the kind, and saying it twice says nothing.
  it("says nothing where the name is already the kind", () => {
    expect(
      kindOfRequest({ id: "9", title: null, media: "film" }),
    ).toBeUndefined();
  });

  it("says nothing where the request service named no kind", () => {
    expect(
      kindOfRequest({ id: "10", title: "Andor", media: null }),
    ).toBeUndefined();
  });
});

describe("whether what the house asked for was read at all", () => {
  // The request service is asked once for the whole household, and the policy
  // is what it answers with.
  it("was read where the service answered with a policy", () => {
    for (const policy of everyPolicy) expect(askingWasRead(policy)).toBe(true);
  });

  // Absent and null are the same absence: the contract writes an unread policy
  // as null, and a report this build's contract predates has no field at all.
  it("was not read where the service could not be asked", () => {
    expect(askingWasRead(null)).toBe(false);
    expect(askingWasRead(undefined)).toBe(false);
  });
});
