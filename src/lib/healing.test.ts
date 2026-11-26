import { describe, expect, it } from "vitest";
import {
  actWord,
  healingReadout,
  runEntry,
  takenLine,
  wedgedEntry,
  type Run,
  type Wedged,
} from "./healing";
import { whenOf } from "./instant";
import { lasting } from "./readout";
import {
  acted,
  healing,
  orphan,
  quiet,
  rehearsal,
  stalled,
} from "../api/health";
import * as m from "../paraglide/messages.js";

type Taken = NonNullable<Run["items"]>[number]["acts"][number];

describe("the self-healing of stuck downloads", () => {
  it("says whether it acts, its rule, what it could not reach and that the list may be short", () => {
    const told = healingReadout(healing);
    expect(told.lines).toStrictEqual([
      m.queue_healing_on(),
      m.queue_rule({ count: 3, grace: lasting(3600) }),
      m.queue_classified({ when: whenOf(1_791_400_700) }),
      m.queue_incomplete(),
      "qBittorrent files Radarr's downloads outside its folder.",
      m.queue_unreached({ service: "sabnzbd", why: "It did not answer." }),
    ]);
    expect(told.entries.map((one) => one.head)).toStrictEqual([
      "Arrival",
      "some.release",
      m.queue_run({ when: whenOf(1_791_400_000) }),
      m.queue_run({ when: whenOf(1_791_390_000) }),
    ]);
  });

  it("says when nothing is unhealthy and healing only looks", () => {
    expect(healingReadout(quiet)).toStrictEqual({
      lines: [
        m.queue_healing_off(),
        m.queue_rule({ count: 3, grace: lasting(90) }),
        m.queue_never_classified(),
        m.queue_none(),
      ],
      entries: [],
    });
  });
});

describe("one unhealthy download", () => {
  it("says who holds it, why, its strikes and what the next run would do, and follows its title", () => {
    expect(wedgedEntry(stalled)).toStrictEqual({
      head: "Arrival",
      lines: [
        m.queue_held_by({ service: "radarr" }),
        m.queue_stalled(),
        "Nothing has moved for an hour.",
        m.queue_strikes({ count: 3 }),
        m.queue_release({ release: "Arrival.2016.2160p" }),
        m.queue_added({ when: whenOf(1_791_390_000) }),
        m.queue_next({
          acts: [
            m.queue_act_remove(),
            m.queue_act_blocklist(),
            m.queue_act_search(),
          ].join(", "),
        }),
      ],
      follow: {
        label: m.action_stuck_follow({ title: "Arrival" }),
        sought: { term: "Arrival", season: undefined },
      },
    });
  });

  it("is named and followed by its release where no title is held, and says it is left alone", () => {
    const entry = wedgedEntry(orphan);
    expect(entry.head).toBe("some.release");
    expect(entry.follow?.sought.term).toBe("some.release");
    expect(entry.lines).toContain(m.queue_orphaned());
    expect(entry.lines).toContain(
      m.queue_in_grace({ until: whenOf(1_791_401_000) }),
    );
  });

  it("has words for every reason, and says so of one it has none for", () => {
    const reason = (why: string): readonly string[] =>
      wedgedEntry({ ...orphan, class: why } as unknown as Wedged).lines;
    expect(reason("slow")).toContain(m.queue_slow());
    expect(reason("failed")).toContain(m.queue_failed());
    expect(reason("stuck-on-metadata")).toContain(m.queue_metadata());
    expect(reason("sideways")).toContain(m.queue_wedge_other());
  });
});

describe("one run", () => {
  it("says what it did to each item, and whether it was a rehearsal", () => {
    expect(runEntry(acted).lines).toStrictEqual([
      m.queue_run_acted(),
      m.queue_run_item({
        named: "Dune",
        why: "stalled",
        acts: [
          m.queue_taken_done({ act: m.queue_act_remove() }),
          m.queue_taken_fell_back({
            act: m.queue_act_blocklist(),
            instead: m.queue_act_remove(),
            why: "The curator refused it.",
          }),
        ].join(", "),
      }),
    ]);
    expect(runEntry(rehearsal).lines).toStrictEqual([
      m.queue_run_rehearsed(),
      m.queue_run_nothing(),
    ]);
    const named = runEntry({
      at: 1,
      rehearsed: true,
      items: [{ release: "r", service: "s", why: "w", acts: [] }],
    });
    expect(named.lines[1]).toBe(
      m.queue_run_item({ named: "r", why: "w", acts: "" }),
    );
  });

  it("has words for every act and outcome, and says so of one it has none for", () => {
    const act = m.queue_act_search();
    const taken = (outcome: string, extra: object = {}): string =>
      takenLine({ act: "search", outcome, ...extra } as unknown as Taken);
    expect(taken("would")).toBe(m.queue_taken_would({ act }));
    expect(taken("refused", { why: "No." })).toBe(
      m.queue_taken_refused({ act, why: "No." }),
    );
    expect(taken("refused")).toBe(m.queue_taken_refused({ act, why: "" }));
    expect(taken("fell-back")).toBe(
      m.queue_taken_fell_back({ act, instead: m.queue_act_other(), why: "" }),
    );
    expect(taken("sideways")).toBe(m.queue_taken_other({ act }));
    expect(
      actWord("sideways" as unknown as Parameters<typeof actWord>[0]),
    ).toBe(m.queue_act_other());
  });
});
