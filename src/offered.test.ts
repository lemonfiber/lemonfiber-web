/**
 * Every request another surface can make of the stack, and every kind of answer
 * the client carries, classified as offered here, offered elsewhere by rule, or
 * not yet offered.
 *
 * **Three lists, and no count kept by hand.** A number of unoffered things that
 * may only fall blames whoever is standing nearest when the stack grows a kind.
 * Naming every one instead makes a new one *unclassified*, which fails saying
 * which it is.
 *
 * The kinds are read off the client: `@lemonfiber/sdk-ts` exports every kind the
 * contract names as `KINDS`, and the actions too, as `ACTIONS`, so a new action
 * the core adds is unclassified until it is placed. The requests that are not
 * actions — the setup walk, serving this surface and the routes of their own —
 * are listed beside them.
 *
 * Each list is held to being true, in both directions. A kind claimed offered is
 * one something the page imports reads; a request claimed offered is on a list a
 * screen the page draws walks; and nothing read or walked is still waiting in
 * another list.
 *
 * What is said of lemonfiber is held to what it serves. The client exports every
 * read the contract lists as `READS`, with the kinds each answers with, so a kind
 * said to be served by no endpoint is one no read answers with.
 *
 * The lists are in `./offered-kinds.testing.ts` and
 * `./offered-requests.testing.ts`, and `./parity.test.ts` holds
 * `docs/surface-parity.md` to them.
 */
import { ACTIONS } from "@lemonfiber/sdk-ts";
import {
  ELSEWHERE_KINDS,
  NOT_YET_KINDS,
  OFFERED_KINDS,
  THROUGH_THE_CLIENT,
  UNSERVED_KINDS,
  kinds,
} from "./offered-kinds.testing";
import {
  ELSEWHERE_REQUESTS,
  EVERY_REQUEST,
  NOT_ACTIONS,
  OFFERED_REQUESTS,
  WALKED,
  requests,
} from "./offered-requests.testing";
import {
  among,
  everyKind,
  everyKindRead,
  everyKindServed,
  reachedFrom,
  read,
  twice,
  without,
} from "./offered.testing";

describe("every kind the client carries", () => {
  it("reads the kinds off the client rather than finding none", () => {
    expect(everyKind().length).toBeGreaterThan(0);
  });

  it("walks from the page's entry to every screen it draws", () => {
    expect(reachedFrom("src/main.ts")).toContain(
      "src/routes/panels/Running.svelte",
    );
  });

  it("has been looked at", () => {
    expect(without(everyKind(), kinds)).toEqual([]);
  });

  it("is classified only while the client still carries it", () => {
    expect(without(kinds, everyKind())).toEqual([]);
  });

  it("is in exactly one list", () => {
    expect(twice(kinds)).toEqual([]);
  });

  it("is claimed offered only where something the page imports reads it", () => {
    expect(without(OFFERED_KINDS, everyKindRead())).toEqual([]);
  });

  it("is offered once something the page imports reads it", () => {
    expect(without(everyKindRead(), OFFERED_KINDS)).toEqual([]);
  });

  it("is read through the client only by an export this page imports", () => {
    const reached = [...reachedFrom("src/main.ts")].map(read).join("\n");
    for (const reader of Object.values(THROUGH_THE_CLIENT)) {
      expect(reached).toMatch(new RegExp(`\\b${reader}\\b[^;]*@lemonfiber`));
    }
  });
});

describe("every request another surface can make", () => {
  it("has been looked at", () => {
    expect(without(EVERY_REQUEST, requests)).toEqual([]);
  });

  it("is classified only while another surface can make it", () => {
    expect(without(requests, EVERY_REQUEST)).toEqual([]);
  });

  it("is in exactly one list", () => {
    expect(twice(requests)).toEqual([]);
  });

  it("is claimed offered only where a screen walks it", () => {
    const walked = WALKED.flatMap((one) => one.list);
    expect(without(OFFERED_REQUESTS, walked)).toEqual([]);
  });

  it("is offered once a screen walks it", () => {
    const walked = WALKED.flatMap((one) => one.list);
    expect(without(walked, OFFERED_REQUESTS)).toEqual([]);
  });

  it("is walked by a screen the page draws", () => {
    const drawn = reachedFrom("src/main.ts");
    for (const { list, named: listed, by } of WALKED) {
      for (const screen of by) expect(drawn).toContain(screen);
      const sources = by.map(read);
      const walks = sources.some((source) =>
        new RegExp(`\\b${listed}\\b`).test(source),
      );
      for (const request of list) {
        const named = sources.some((source) => source.includes(`"${request}"`));
        expect(walks || named, request).toBe(true);
      }
    }
  });
});

describe("every action the contract lists", () => {
  it("is read off the client rather than found to be none", () => {
    expect(Object.keys(ACTIONS).length).toBeGreaterThan(0);
  });

  it("is a request named once, and no request that is not an action shares its name", () => {
    expect(twice(EVERY_REQUEST)).toEqual([]);
    expect(among(NOT_ACTIONS, Object.keys(ACTIONS))).toEqual([]);
  });
});

describe("what is offered elsewhere", () => {
  it("is answered by no read the contract lists", () => {
    expect(among(Object.keys(ELSEWHERE_KINDS), everyKindServed())).toEqual([]);
  });

  it("names the requirement that says so, and why", () => {
    const excuses = [
      ...Object.values(ELSEWHERE_KINDS),
      ...Object.values(ELSEWHERE_REQUESTS),
    ];
    for (const because of excuses) {
      expect(because).toMatch(/^[A-Z]+\d*-R\d+ — \S/);
    }
  });
});

describe("what waits on lemonfiber", () => {
  it("reads the reads off the client rather than finding none", () => {
    expect(everyKindServed().length).toBeGreaterThan(0);
  });

  it("is not read here yet", () => {
    expect(without(UNSERVED_KINDS, Object.keys(NOT_YET_KINDS))).toEqual([]);
  });

  it("is answered by no read the contract lists", () => {
    expect(among(UNSERVED_KINDS, everyKindServed())).toEqual([]);
  });
});
