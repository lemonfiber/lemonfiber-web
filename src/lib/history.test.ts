import { describe, expect, it } from "vitest";
import { changeLines, wordOfReversal, type Change } from "./history";
import { whenOf } from "./instant";
import { fixed, written } from "../api/histories";
import * as m from "../paraglide/messages.js";

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
