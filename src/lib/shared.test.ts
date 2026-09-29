import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import {
  clientLine,
  lineLines,
  wordOfRestraint,
  type Restraint,
  type Shared,
} from "./shared";
import { bytes } from "./figures";
import { declared, means, shared } from "../api/lines";
import * as m from "../paraglide/messages.js";

const everyRestraint: readonly Restraint[] = [
  "unlimited",
  "limited",
  "scheduled-active",
  "scheduled-quiet",
  "overridden",
  "cap-warning",
  "cap-exceeded",
];

/** One client that answered, holding each direction to this verdict. */
const holding = (
  verdict:
    "unasked" | "nothing-to-limit" | "holding" | "ignored" | "overrunning",
): Shared["clients"][number] => ({
  client: "qbittorrent",
  answer: {
    answered: "held",
    down: { verdict },
    up: { verdict },
  },
});

describe("where the line stands", () => {
  it("says each standing apart", () => {
    const said = new Set(everyRestraint.map(wordOfRestraint));
    expect(said.size).toBe(everyRestraint.length);
  });

  // A later build may name a standing this one has no word for.
  it("says so where it is past its words", () => {
    expect(wordOfRestraint("rationed" as Restraint)).toBe(
      m.line_unrecognised(),
    );
  });
});

describe("what each download client did about its limits", () => {
  it("says each direction's verdict", () => {
    expect(clientLine(holding("holding"))).toBe(
      m.line_client_held({
        client: "qbittorrent",
        down: m.line_verdict_holding(),
        up: m.line_verdict_holding(),
      }),
    );
  });

  it("has a word for every verdict", () => {
    const verdicts = [
      "unasked",
      "nothing-to-limit",
      "holding",
      "ignored",
      "overrunning",
    ] as const;
    const said = new Set(verdicts.map((one) => clientLine(holding(one))));
    expect(said.size).toBe(verdicts.length);
    expect(clientLine(holding("wandering" as unknown as "holding"))).toContain(
      m.line_verdict_unrecognised(),
    );
  });

  it("says what a client that did not answer said", () => {
    expect(
      clientLine({
        client: "sabnzbd",
        answer: { answered: "silent", said: "Refused." },
      }),
    ).toBe(m.line_client_silent({ client: "sabnzbd", said: "Refused." }));
  });
});

describe("how the line is shared, line by line", () => {
  it("says where it stands, what it means, each limit, cautions and clients", () => {
    expect(lineLines(shared)).toStrictEqual([
      m.line_scheduled_active(),
      means,
      shared.down.says,
      shared.up.says,
      ...shared.cautions,
      ...shared.clients.map(clientLine),
    ]);
  });

  it("says what holding uploads back costs, and what lifts or spends the limits", () => {
    const lifted = {
      ...declared,
      respite_says: "The limits are lifted for another 20 minutes.",
      acting: "The cap is spent, so nothing more is fetched this month.",
    };
    expect(lineLines(lifted)).toStrictEqual([
      m.line_scheduled_active(),
      means,
      shared.down.says,
      shared.up.says,
      declared.ratio,
      lifted.respite_says,
      lifted.acting,
      ...shared.cautions,
      ...shared.clients.map(clientLine),
    ]);
  });

  it("says where the month stands against a cap, and what the count leaves out", () => {
    const capped: Shared = {
      ...shared,
      cap: { monthly: 500_000_000_000, exceeded: "pause" },
      reached: "warning",
      metered: {
        month: "September",
        down: 420_000_000_000,
        up: 12_000_000_000,
        excludes: "What the rest of the house moves is not counted.",
        incomplete: ["One client restarted, and its count began again."],
      },
    };
    const said = lineLines(capped);
    expect(said).toContain(
      m.line_cap_standing({
        cap: bytes(500_000_000_000),
        standing: m.line_reached_warning(),
      }),
    );
    expect(said).toContain(
      m.line_metered({
        month: "September",
        down: bytes(420_000_000_000),
        up: bytes(12_000_000_000),
      }),
    );
    expect(said).toContain("What the rest of the house moves is not counted.");
    expect(said).toContain("One client restarted, and its count began again.");
  });

  it("has words for every place the month can stand", () => {
    const said = (
      reached: NonNullable<Shared["reached"]> | null,
    ): readonly string[] =>
      lineLines({ ...shared, cap: { monthly: 1, exceeded: "pause" }, reached });
    const line = (standing: string): string =>
      m.line_cap_standing({ cap: bytes(1), standing });
    expect(said("within")).toContain(line(m.line_reached_within()));
    expect(said("exceeded")).toContain(line(m.line_reached_exceeded()));
    expect(said(null)).toContain(line(m.line_reached_unread()));
    expect(said("overdrawn" as NonNullable<Shared["reached"]>)).toContain(
      line(m.line_reached_unrecognised()),
    );
  });

  it("is what a record of a declaration carries", () => {
    expect(linesOf({ kind: "bandwidth", report: declared })).toStrictEqual(
      lineLines(declared),
    );
  });
});
