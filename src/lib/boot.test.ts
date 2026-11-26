import { describe, expect, it } from "vitest";
import { bootReadout, verificationLines, type Verification } from "./boot";
import { whenOf } from "./instant";
import { booted, failed, notBack, passed } from "../api/health";
import * as m from "../paraglide/messages.js";

describe("starting with the machine", () => {
  it("says when it started and the check after that start", () => {
    const told = bootReadout(booted);
    expect(told.lines).toStrictEqual([
      m.boot_started({ when: whenOf(1_791_400_000) }),
    ]);
    expect(told.entries).toStrictEqual([
      { head: m.boot_after_latest(), lines: verificationLines(passed) },
    ]);
  });

  it("says a check after an earlier start is that, never the check after the latest", () => {
    const told = bootReadout(notBack);
    expect(told.lines).toStrictEqual([
      m.boot_started({ when: whenOf(1_791_400_000) }),
      m.boot_failing_for({ since: whenOf(1_791_300_000), count: 2 }),
      m.boot_declined({ why: "Starting with the machine is switched off." }),
      m.boot_none_after(),
    ]);
    expect(told.entries[0]?.head).toBe(m.boot_earlier_unsaid());
    const named = bootReadout({ last_verified: passed });
    expect(named.entries[0]?.head).toBe(
      m.boot_earlier({ when: whenOf(1_791_400_000) }),
    );
  });

  it("says when nothing is kept, the machine does not say when it started, or how many starts are unknown", () => {
    expect(bootReadout({ failing_since: 1_791_300_000 }).lines).toStrictEqual([
      m.boot_started_unsaid(),
      m.boot_failing({ since: whenOf(1_791_300_000) }),
      m.boot_none(),
    ]);
  });
});

describe("one check after a start", () => {
  it("says what came back, the port, and what was said", () => {
    expect(verificationLines(passed)).toStrictEqual([
      m.boot_checked({ when: whenOf(passed.at) }),
      m.boot_passed(),
      m.boot_tunnel_held(),
      m.boot_port({ was: "51413", now: "51413" }),
    ]);
    expect(verificationLines(failed)).toStrictEqual([
      m.boot_checked({ when: whenOf(failed.at) }),
      m.boot_failed(),
      m.boot_not_back({ names: "sonarr, radarr" }),
      m.boot_tunnel_lost({ said: "The tunnel's handshake timed out." }),
      m.boot_port({ was: "51413", now: m.boot_port_none() }),
      m.boot_port_unpushed(),
      "Two services did not come back after the start.",
    ]);
  });

  it("has words for every outcome and tunnel, and says so of one it has none for", () => {
    const waiting: Verification = {
      at: 1,
      outcome: "waiting-for-install",
      tunnel: { state: "not-checked" },
    };
    expect(verificationLines(waiting)).toStrictEqual([
      m.boot_checked({ when: whenOf(1) }),
      m.boot_waiting(),
      m.boot_tunnel_unchecked(),
    ]);
    const strange = {
      at: 1,
      outcome: "sideways",
      tunnel: { state: "sideways" },
    } as unknown as Verification;
    expect(verificationLines(strange)).toStrictEqual([
      m.boot_checked({ when: whenOf(1) }),
      m.boot_outcome_other(),
      m.boot_tunnel_other(),
    ]);
  });
});
