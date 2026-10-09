import { describe, expect, it } from "vitest";
import {
  flipOf,
  oursLines,
  theirsLines,
  wordOfWhose,
  type Theirs,
} from "./leaving";
import { household, indexing, stranger, updates } from "../api/leavings";
import * as m from "../paraglide/messages.js";

describe("one of lemonfiber's own requests", () => {
  it("says where it goes, what travels, that it is allowed, and what switching it off costs", () => {
    expect(oursLines(updates)).toStrictEqual([
      m.outbound_ours_goes({ destination: "api.github.com" }),
      m.outbound_sends({ sends: updates.sends }),
      m.outbound_allowed({ setting: "updates.check" }),
      m.outbound_cost({ cost: updates.cost }),
    ]);
  });

  it("says when nothing is set up for it to reach, and when it is switched off", () => {
    expect(oursLines(household)).toStrictEqual([
      m.outbound_ours_nowhere(),
      m.outbound_sends({ sends: household.sends }),
      m.outbound_off({ setting: "notify.household" }),
      m.outbound_cost({ cost: household.cost }),
    ]);
  });

  it("names every place it goes", () => {
    expect(
      oursLines({ ...updates, destination: ["one.example", "two.example"] }),
    ).toContain(
      m.outbound_ours_goes({ destination: "one.example, two.example" }),
    );
  });
});

describe("a request one of the stack's services makes", () => {
  it("says where it goes, what for, and whose it is", () => {
    expect(theirsLines(indexing)).toStrictEqual([
      m.outbound_theirs_goes({ destination: indexing.destination }),
      indexing.purpose,
      m.outbound_whose_stack(),
    ]);
  });

  it("says it reaches nothing, and that no record is shipped for it", () => {
    expect(theirsLines(stranger)).toStrictEqual([
      m.outbound_theirs_nowhere(),
      stranger.purpose,
      m.outbound_whose_plugin({ named: "plugin-komga" }),
      m.outbound_unrecorded(),
    ]);
  });

  it("has words for whose request it is, however that was settled", () => {
    const cases: readonly [Theirs["origin"], string][] = [
      [{ origin: "operator" }, m.outbound_whose_stack()],
      [
        { origin: "orphaned", named: "plugin-old" },
        m.outbound_whose_plugin({ named: "plugin-old" }),
      ],
      [
        {
          origin: "overridden",
          named: "plugin-new",
          replaced: { from: { origin: "bundled" }, withheld: false },
        },
        m.outbound_whose_plugin({ named: "plugin-new" }),
      ],
      [
        { origin: "unknown", why: "The record would not read." },
        m.outbound_whose_unknown({ why: "The record would not read." }),
      ],
    ];
    for (const [origin, word] of cases) expect(wordOfWhose(origin)).toBe(word);
    const strange = { origin: "elsewhere" } as unknown as Theirs["origin"];
    expect(wordOfWhose(strange)).toBe(m.outbound_whose_other());
  });
});

describe("switching one of lemonfiber's own requests", () => {
  it("turns an allowed request off, and one switched off back on, by its own setting", () => {
    expect(flipOf(updates)).toStrictEqual({
      key: updates.switch,
      value: "off",
    });
    expect(flipOf(household)).toStrictEqual({
      key: household.switch,
      value: "on",
    });
  });
});
