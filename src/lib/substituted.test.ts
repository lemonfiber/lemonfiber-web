import { describe, expect, it } from "vitest";
import { substitutedLines } from "./substituted";
import { filled, wouldFill, wouldLeave } from "../api/substitutions";
import * as m from "../paraglide/messages.js";

describe("what choosing a filler would come to", () => {
  it("says what would fill it, that nothing does now, what asks, the setting and the reason", () => {
    expect(substitutedLines(wouldFill)).toStrictEqual([
      m.fill_would({ capability: "requests", service: "jellyseerr" }),
      m.fill_was_nothing(),
      m.fill_asked_by({ services: "jellyfin" }),
      m.fill_setting({ setting: "wiring.requests = jellyseerr" }),
      m.fill_why({ why: "Jellyseerr knows the household." }),
    ]);
  });

  it("names what it takes the place of, and everything it would leave unfilled", () => {
    expect(substitutedLines(wouldLeave)).toStrictEqual([
      m.fill_would({ capability: "subtitles", service: "subgen" }),
      m.fill_was({ service: "bazarr" }),
      m.fill_leaves({ by: "sonarr", capability: "subtitle-hints" }),
      m.fill_setting({ setting: "wiring.subtitles = subgen" }),
    ]);
  });

  it("says it in the past once written", () => {
    expect(substitutedLines(filled)[0]).toBe(
      m.fill_did({ capability: "requests", service: "jellyseerr" }),
    );
    const left = { ...wouldLeave, applied: true, rehearsed: false };
    expect(substitutedLines(left)).toContain(
      m.fill_left({ by: "sonarr", capability: "subtitle-hints" }),
    );
  });

  it("says no reason where an empty one was kept", () => {
    const unsaid = {
      ...wouldFill,
      substitution: { ...wouldFill.substitution, why: "" },
    };
    expect(substitutedLines(unsaid)).not.toContain(m.fill_why({ why: "" }));
  });
});
