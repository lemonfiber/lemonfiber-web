import { describe, expect, it } from "vitest";
import { changeLines, whenOf, wordOfReversal, type Change } from "./history";
import { fixed, written } from "../api/histories";
import * as m from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";

describe("when a change was made", () => {
  it("is a day and a time in the reader's own calendar", () => {
    expect(whenOf("1791400000")).toBe(
      new Intl.DateTimeFormat(getLocale(), {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(1_791_400_000_000)),
    );
  });

  // A stamp of zero is how a machine whose clock would not answer stamps a
  // change, and showing it as a day in 1970 would be inventing one.
  it("says the clock could not say, rather than naming the epoch", () => {
    expect(whenOf("0")).toBe(m.history_when_unread());
  });

  it("is shown as it arrived where it does not read as seconds", () => {
    expect(whenOf("yesterday")).toBe("yesterday");
    expect(whenOf("99999999999999999999")).toBe("99999999999999999999");
  });
});

describe("one change lemonfiber made", () => {
  it("says what made it, when, and that it can be put back whole", () => {
    expect(changeLines(written)).toStrictEqual([
      m.history_made({ operation: "seed", target: "sonarr" }),
      m.history_when({ when: whenOf(written.at) }),
      m.history_back_whole(),
    ]);
  });

  it("says why it goes back only in part, what to do instead, and what goes with it", () => {
    expect(changeLines(fixed)).toStrictEqual([
      m.history_made({ operation: "an applied fix", target: "qbittorrent" }),
      m.history_when({ when: m.history_when_unread() }),
      m.history_back_partial(),
      fixed.because,
      fixed.instead,
      m.history_alongside({ count: 3 }),
    ]);
  });

  it("has a word for how far every change goes back, and says so of one it has none for", () => {
    expect(wordOfReversal("none")).toBe(m.history_back_none());
    expect(wordOfReversal("sideways" as unknown as Change["reversal"])).toBe(
      m.history_back_other(),
    );
  });
});
