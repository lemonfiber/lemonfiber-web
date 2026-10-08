import { describe, expect, it } from "vitest";
import { linkLines, unfilledLine, type Link } from "./wiring";
import {
  byName,
  chosen,
  contested,
  each,
  outright,
  wiring,
} from "../api/wirings";
import * as m from "../paraglide/messages.js";

describe("one link", () => {
  it("says what it asks for and the one service that does it", () => {
    expect(linkLines(outright)).toStrictEqual([
      m.wiring_asks({ capability: "download-client" }),
      m.wiring_outright({ services: "qbittorrent" }),
    ]);
  });

  it("says it reaches every claimant where it asks for all of them", () => {
    expect(linkLines(each)).toContain(
      m.wiring_each({ services: "sonarr, radarr" }),
    );
  });

  it("names a contest and reaches none of it, and names a claimant a plugin brought", () => {
    expect(linkLines(contested)).toStrictEqual([
      m.wiring_asks({ capability: "requests" }),
      m.wiring_contested({ claimants: "jellyseerr, ombi" }),
      m.wiring_brought({ service: "ombi", named: "plugin-ombi" }),
    ]);
  });

  it("says who chose, over what, and why", () => {
    expect(linkLines(chosen)).toStrictEqual([
      m.wiring_asks({ capability: "subtitles" }),
      m.wiring_chosen_by_you({ services: "bazarr", over: "subgen" }),
      "Bazarr finds them rather than writing them.",
    ]);
  });

  it("says when the stack chose, and no reason where none was given", () => {
    const stackChose: Link = {
      by: "radarr",
      reaches: {
        how: "asked",
        capability: "subtitles",
        services: ["bazarr"],
        settled: { settled: "chosen", whose: "stack", over: ["subgen"] },
        origins: {
          bazarr: {
            origin: "overridden",
            named: "plugin-subs",
            replaced: { from: { origin: "bundled" }, withheld: false },
          },
          subgen: { origin: "orphaned", named: "plugin-old" },
        },
      },
    };
    expect(linkLines(stackChose)).toStrictEqual([
      m.wiring_asks({ capability: "subtitles" }),
      m.wiring_chosen_by_stack({ services: "bazarr", over: "subgen" }),
      m.wiring_brought({ service: "bazarr", named: "plugin-subs" }),
      m.wiring_brought({ service: "subgen", named: "plugin-old" }),
    ]);
  });

  it("says nothing does it, and has words for a settling it does not know", () => {
    const unfilled: Link = {
      by: "lidarr",
      reaches: {
        how: "asked",
        capability: "music-indexer",
        services: [],
        settled: { settled: "unfilled" },
        origins: {},
      },
    };
    expect(linkLines(unfilled)).toContain(m.wiring_unfilled());
    const strange = {
      by: "lidarr",
      reaches: {
        how: "asked",
        capability: "music-indexer",
        services: [],
        settled: { settled: "pending" },
        origins: {},
      },
    } as unknown as Link;
    expect(linkLines(strange)).toContain(m.wiring_settled_other());
  });

  it("says a link kept to a named service is, and why", () => {
    expect(linkLines(byName)).toStrictEqual([
      m.wiring_by_name({
        service: "jellyfin-db",
        why: "It keeps its own database.",
      }),
    ]);
  });
});

describe("an ask nothing fills", () => {
  it("names what asked and what for", () => {
    expect(wiring.unfilled.map(unfilledLine)).toStrictEqual([
      m.wiring_nothing_fills({ by: "lidarr", capability: "music-indexer" }),
    ]);
  });
});
