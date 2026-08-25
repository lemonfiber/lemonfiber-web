import { describe, expect, it } from "vitest";
import {
  everyRequestState,
  kindOfRequest,
  nameOfRequest,
  standingOf,
  wordOfRequestState,
} from "./household";
import * as m from "../paraglide/messages.js";

describe("where a request stands", () => {
  it.each(everyRequestState)("has a word for %s", (state) => {
    expect(wordOfRequestState(state)).not.toBe("");
  });

  it("says each of them differently", () => {
    const said = new Set(everyRequestState.map(wordOfRequestState));
    expect(said.size).toBe(everyRequestState.length);
  });

  it("reads a request's own state", () => {
    expect(standingOf({ title: "Arrival", media: "film", state: "here" })).toBe(
      m.request_state_here(),
    );
  });

  // A state this build has no word for is said plainly rather than guessed into
  // the nearest word it does have.
  it("says so where the request service named a state this build does not know", () => {
    expect(standingOf({ title: "Arrival", media: "film", state: null })).toBe(
      m.request_state_unrecognised(),
    );
    expect(standingOf({})).toBe(m.request_state_unrecognised());
  });
});

describe("what to call a request", () => {
  it("uses the title where a service has been told one", () => {
    expect(nameOfRequest({ title: "Andor", media: "series" })).toBe("Andor");
  });

  // A request no service holds yet has no title to show, so naming it by what
  // it is keeps the row honest.
  it("names an untitled request by what it is", () => {
    expect(nameOfRequest({ title: null, media: "film" })).toBe(
      m.request_a_kind({ media: "film" }),
    );
  });

  it("names one that is neither by neither", () => {
    expect(nameOfRequest({ title: null, media: null })).toBe(
      m.request_unnamed(),
    );
  });
});

describe("the kind set beside the name", () => {
  it("says the kind where the name is a title", () => {
    expect(kindOfRequest({ title: "Andor", media: "series" })).toBe("series");
  });

  // The name is already the kind, and saying it twice says nothing.
  it("says nothing where the name is already the kind", () => {
    expect(kindOfRequest({ title: null, media: "film" })).toBeUndefined();
  });

  it("says nothing where the request service named no kind", () => {
    expect(kindOfRequest({ title: "Andor", media: null })).toBeUndefined();
  });
});
