import { describe, expect, it } from "vitest";
import {
  approvalOf,
  besideOf,
  countOf,
  dayOf,
  leftOf,
  mediumOf,
  watchOf,
  type Medium,
} from "./yours";
import type { Access, Allowance, Policy, Request } from "./wire";
import { getLocale } from "../paraglide/runtime.js";
import * as m from "../paraglide/messages.js";

/** A member who may ask within a limit and has room left. */
const within: Allowance = {
  films: { used: 4, limit: 5, remaining: 1, period: "a month" },
  television: { used: 3, limit: 5, remaining: 2 },
  frees_up: "2026-09-14T12:00:00Z",
  policy: "within-a-limit",
  standing: "near-quota",
};

/** A member nothing limits. */
const open: Access = {
  administrator: false,
  disabled: false,
  every_library: true,
  libraries: [],
  restriction: "unrestricted",
  unrated: "let-through",
};

/** A word a newer lemonfiber might send that this build has none for. */
const unheardOf = "a-word-from-later" as never;

describe("whether asking needs approval", () => {
  it.each([
    ["trusted", m.member_approval_none()],
    ["within-a-limit", m.member_approval_within()],
    ["everything-waits", m.member_approval_needed()],
  ] satisfies [Policy, string][])("says it for %s", (policy, said) => {
    expect(approvalOf({ ...within, policy })).toBe(said);
  });

  it("says plainly where the policy is one it has no word for", () => {
    expect(approvalOf({ ...within, policy: unheardOf })).toBe(
      m.member_approval_unrecognised(),
    );
  });
});

describe("whether they have allowance left", () => {
  it("says nothing limits them where nothing does", () => {
    expect(leftOf({ ...within, standing: "unlimited" })).toBe(
      m.member_allowance_unlimited(),
    );
  });

  // Films and television are counted apart, and television a season at a
  // time, so neither count is folded into the other.
  it.each(["within-quota", "near-quota"] as const)(
    "says both counts for %s",
    (standing) => {
      const said = leftOf({ ...within, standing });
      expect(said).toBe(
        m.member_allowance_left({
          films: countOf(within.films, m.member_what_films()),
          television: countOf(within.television, m.member_what_seasons()),
        }),
      );
      expect(said).toContain(m.member_what_films());
      expect(said).toContain(m.member_what_seasons());
    },
  );

  it("says none is left, and the day one more becomes possible", () => {
    const said = leftOf({ ...within, standing: "quota-exhausted" });
    expect(said).toContain(m.member_allowance_spent());
    expect(said).toContain(
      m.member_allowance_frees({ day: dayOf("2026-09-14T12:00:00Z") }),
    );
  });

  // An invented day would be a promise about a day on which nothing happens.
  it("says when is not known where the request service's dates were not read", () => {
    const said = leftOf({
      ...within,
      standing: "quota-exhausted",
      frees_up: null,
    });
    expect(said).toContain(m.member_allowance_frees_unknown());
  });

  it("says plainly where the standing is one it has no word for", () => {
    expect(leftOf({ ...within, standing: unheardOf })).toBe(
      m.member_allowance_unrecognised(),
    );
  });
});

describe("one count", () => {
  const what = m.member_what_films();

  it("says what is left of a limit, over the period it runs for", () => {
    expect(
      countOf({ used: 4, limit: 5, remaining: 1, period: "a month" }, what),
    ).toBe(
      m.member_count_left_in({
        remaining: 1,
        limit: 5,
        what,
        period: "a month",
      }),
    );
  });

  it("says what is left of a limit that runs from the beginning", () => {
    expect(countOf({ used: 4, limit: 5, remaining: 1 }, what)).toBe(
      m.member_count_left({ remaining: 1, limit: 5, what }),
    );
  });

  // No limit and a limit of nought are different answers.
  it("says there is no limit where none arrived", () => {
    expect(countOf({ used: 4 }, what)).toBe(m.member_count_unlimited({ what }));
  });

  it("keeps a limit of nought as a limit", () => {
    expect(countOf({ used: 0, limit: 0, remaining: 0 }, what)).toBe(
      m.member_count_left({ remaining: 0, limit: 0, what }),
    );
  });

  // A limit whose remainder did not arrive is not the limit untouched.
  it("says the remainder was not read where it did not arrive", () => {
    expect(countOf({ used: 4, limit: 5, remaining: null }, what)).toBe(
      m.member_count_unread({ what }),
    );
  });
});

describe("the day an instant falls on", () => {
  it("reads it in the page's own language", () => {
    const instant = "2026-09-14T12:00:00Z";
    expect(dayOf(instant)).toBe(
      new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" }).format(
        new Date(instant),
      ),
    );
    expect(dayOf(instant)).toContain("2026");
  });

  it("shows an instant that does not read as one as it arrived", () => {
    expect(dayOf("the fourteenth")).toBe("the fourteenth");
  });
});

describe("what they may watch", () => {
  it("says a member nothing holds can watch everything, and nothing more", () => {
    expect(watchOf(open)).toEqual([m.member_watch_unrestricted()]);
  });

  // Both sides of a rating limit, because either alone misleads.
  it("names the certificates a rating lets through and holds back", () => {
    const said = watchOf({
      ...open,
      restriction: "rating-limited",
      age_limit: 12,
      rated: { allows: ["U", "PG"], holds_back: ["12A"], fell_back: false },
      unrated: "held-back",
    });
    expect(said).toEqual([
      m.member_watch_rating(),
      m.member_watch_allows({ certificates: "U, PG" }),
      m.member_watch_holds({ certificates: "12A" }),
      m.unrated_held_back(),
    ]);
  });

  it("says neither side where the media server named nothing on it", () => {
    const said = watchOf({
      ...open,
      restriction: "rating-limited",
      rated: { allows: [], holds_back: [], fell_back: true },
    });
    expect(said).toEqual([m.member_watch_rating(), m.unrated_let_through()]);
  });

  it("gives the bare figure where no certificates were named", () => {
    const said = watchOf({
      ...open,
      restriction: "rating-limited",
      age_limit: 12,
    });
    expect(said).toContain(m.member_watch_age({ age: 12 }));
  });

  it("names the libraries a member held to some of them can watch", () => {
    const said = watchOf({
      ...open,
      restriction: "library-limited",
      every_library: false,
      libraries: ["Films", "Series"],
    });
    expect(said).toEqual([
      m.member_watch_libraries(),
      m.unrated_let_through(),
      m.member_watch_in({ libraries: "Films, Series" }),
    ]);
  });

  it("names no libraries where none were listed", () => {
    const said = watchOf({ ...open, every_library: false, libraries: [] });
    expect(said).toEqual([m.member_watch_unrestricted()]);
  });

  it.each([
    ["both", m.member_watch_both()],
    ["inconsistent", m.member_watch_inconsistent()],
  ] satisfies [Access["restriction"], string][])(
    "says what %s holds them to",
    (restriction, said) => {
      expect(watchOf({ ...open, restriction })[0]).toBe(said);
    },
  );

  it("says plainly where what holds them is one it has no word for", () => {
    expect(watchOf({ ...open, restriction: unheardOf })[0]).toBe(
      m.member_watch_unrecognised(),
    );
  });

  it("says plainly where what becomes of unrated content is one it has no word for", () => {
    expect(
      watchOf({ ...open, restriction: "rating-limited", unrated: unheardOf }),
    ).toContain(m.unrated_unrecognised());
  });
});

describe("what kind of thing a holding is", () => {
  it.each([
    ["film", m.member_medium_film()],
    ["series", m.member_medium_series()],
    ["episode", m.member_medium_episode()],
    ["other", m.member_medium_other()],
  ] satisfies [Medium, string][])(
    "says %s in the household's words",
    (medium, said) => {
      expect(mediumOf(medium)).toBe(said);
    },
  );

  it("says plainly where the kind is one it has no word for", () => {
    expect(mediumOf(unheardOf)).toBe(m.member_medium_unrecognised());
  });
});

describe("what is said beneath where a request stands", () => {
  const request: Request = { id: 1, title: "Arrival", media: "film" };

  // They are told it did not work and that the operator has been told, and
  // nothing of the stack's own account of why.
  it("tells somebody whose request did not work that the operator has been told", () => {
    expect(
      besideOf({
        ...request,
        state: "failed",
        refused: { reason: "The indexer returned nothing." },
      }),
    ).toBe(m.member_failed_told());
  });

  it("carries the reason a request was turned down with", () => {
    expect(
      besideOf({
        ...request,
        state: "declined",
        refused: { reason: "Not tonight." },
      }),
    ).toBe("Not tonight.");
  });

  it("says how long one has waited, where the request service dated it", () => {
    expect(
      besideOf({ ...request, state: "waiting-for-approval", waiting_days: 6 }),
    ).toBe(m.waiting_days({ days: 6 }));
  });

  it("says nothing where there is nothing to say", () => {
    expect(
      besideOf({ ...request, state: "here", refused: null }),
    ).toBeUndefined();
  });
});
