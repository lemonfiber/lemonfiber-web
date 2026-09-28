import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import {
  configLines,
  originWords,
  type Configured,
  type Setting,
} from "./configured";
import { applied, everySetting, madeAtOnce, staged } from "../api/configs";
import * as m from "../paraglide/messages.js";

/** A review with one field changed, on the staged change. */
const reviewed = (
  over: Partial<NonNullable<Configured["review"]>>,
): Configured => ({
  ...staged,
  consequence: null,
  review: {
    change: { cost: "cheap", key: "k", to: "b" },
    stance: "pending",
    ...over,
  },
});

describe("where a setting's value came from", () => {
  it.each([
    [{ origin: "bundled" }, m.config_origin_bundled()],
    [{ origin: "operator" }, m.config_origin_operator()],
    [{ origin: "plugin", named: "p" }, m.config_origin_plugin({ named: "p" })],
    [
      { origin: "orphaned", named: "p" },
      m.config_origin_orphaned({ named: "p" }),
    ],
    [
      { origin: "unknown", why: "unreadable" },
      m.config_origin_unknown({ why: "unreadable" }),
    ],
    [
      {
        origin: "overridden",
        named: "p",
        replaced: { from: { origin: "bundled" }, withheld: false },
      },
      m.config_origin_overridden({ named: "p" }),
    ],
  ] as const)("says %j in a few words", (origin, said) => {
    expect(originWords(origin as Setting["origin"])).toBe(said);
  });

  it("says so of an origin wider than this build's contract", () => {
    const wider = { origin: "elsewhere" } as unknown as Setting["origin"];
    expect(originWords(wider)).toBe(m.config_origin_other());
  });
});

describe("what changing a setting came to", () => {
  it("says a staged change and everything it costs, in lemonfiber's words", () => {
    expect(configLines(staged)).toStrictEqual([
      m.came_config_pending({
        key: "data_location",
        from: "/srv/media",
        to: "/mnt/media",
      }),
      "Moving the library takes as long as copying it.",
      m.came_config_active({
        name: "Big.Film.2160p",
        protocol: "torrent",
        progress: "42",
      }),
      m.came_config_library_carried({ service: "sonarr", path: "/tv" }),
      "The new location holds the same folders.",
    ]);
  });

  it("says a change made, and one made at once", () => {
    expect(configLines(applied)[0]).toBe(
      m.came_config_applied({
        key: "data_location",
        from: "/srv/media",
        to: "/mnt/media",
      }),
    );
    expect(configLines(madeAtOnce)).toStrictEqual([
      m.came_config_applied({ key: "port_forwarding", from: "on", to: "off" }),
    ]);
  });

  it("says a change turned away, with lemonfiber's reason", () => {
    expect(
      configLines(
        reviewed({ stance: "blocked", refusal: "The path does not exist." }),
      ),
    ).toStrictEqual([
      m.came_config_blocked({ key: "k" }),
      "The path does not exist.",
    ]);
  });

  it("says nothing was set before, and nothing changed where nothing would", () => {
    expect(configLines(reviewed({}))[0]).toBe(
      m.came_config_pending({
        key: "k",
        from: m.config_value_unset(),
        to: "b",
      }),
    );
    expect(configLines(reviewed({ stance: "unchanged" }))).toStrictEqual([
      m.came_config_unchanged({ key: "k", to: "b" }),
    ]);
  });

  it("says what a change stops, keeps, asks for and finds edited, and what it loses", () => {
    const costly = reviewed({
      findings: {
        active: [],
        edited: { found: "a", secret: false, wrote: "b" },
        keeps: ["what was downloaded"],
        library: [
          {
            because: "Nothing is there.",
            carried: false,
            path: "/tv",
            service: "sonarr",
          },
        ],
        opens: [{ because: "Usenet needs one.", what: "a provider" }],
        stops: ["sabnzbd"],
      },
    });
    expect(configLines(costly).slice(1)).toStrictEqual([
      m.came_config_stops({ names: "sabnzbd" }),
      m.came_config_keeps({ names: "what was downloaded" }),
      m.came_config_opens({ what: "a provider", because: "Usenet needs one." }),
      m.came_config_edited({ found: "a", wrote: "b" }),
      m.came_config_library_lost({ service: "sonarr", path: "/tv" }),
      "Nothing is there.",
    ]);
  });

  it.each([
    [
      { outcome: "valid", observed: "3 indexers" },
      m.came_config_proof_valid({ observed: "3 indexers" }),
    ],
    [
      { outcome: "rejected", detail: "401" },
      m.came_config_proof_rejected({ detail: "401" }),
    ],
    [
      { outcome: "unreachable", detail: "timeout" },
      m.came_config_proof_unreachable({ detail: "timeout" }),
    ],
    [
      { outcome: "degraded", detail: "slow" },
      m.came_config_proof_degraded({ detail: "slow" }),
    ],
    [{ outcome: "elsewhere" }, m.came_config_proof_other()],
  ] as const)(
    "says what proving a new credential came to: %j",
    (proof, said) => {
      const proven = reviewed({
        stance: "applied",
        proof: proof as NonNullable<NonNullable<Configured["review"]>["proof"]>,
      });
      expect(configLines(proven).at(-1)).toBe(said);
    },
  );

  it("says so of a stance wider than this build's contract", () => {
    const wider = reviewed({
      stance: "elsewhere",
    } as unknown as Partial<NonNullable<Configured["review"]>>);
    expect(configLines(wider)).toStrictEqual([
      m.came_config_other({ key: "k" }),
    ]);
  });

  it("says a reading changed nothing, and a rehearsal is one", () => {
    expect(configLines(everySetting)).toStrictEqual([
      m.came_config_read({ count: "3" }),
    ]);
    expect(
      configLines({ ...everySetting, rehearsed: true, review: null }),
    ).toStrictEqual([m.came_rehearsed(), m.came_config_read({ count: "3" })]);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "config", report: staged })).toStrictEqual(
      configLines(staged),
    );
  });
});
