import { describe, expect, it } from "vitest";
import { whenOf } from "./instant";
import { lasting } from "./readout";
import {
  coveredWord,
  monitorEntry,
  watcherReadout,
  type Monitor,
} from "./watcher";
import { beat, blind, door, watched } from "../api/health";
import * as m from "../paraglide/messages.js";

describe("what watches the stack from outside", () => {
  it("names the watcher, when it was asked, and what no monitor covers", () => {
    const told = watcherReadout(watched);
    expect(told.lines).toStrictEqual([
      m.watcher_by({ plugin: "uptime-kuma" }),
      m.watcher_asked({ when: whenOf(watched.read_at) }),
      m.watcher_uncovered({ names: "prowlarr" }),
    ]);
    expect(told.entries.map((one) => one.head)).toStrictEqual([
      door.name,
      beat.name,
    ]);
  });

  it("says a watcher that does not answer sees nothing, never that all is clear", () => {
    const told = watcherReadout(blind);
    expect(told.lines).toContain(
      m.watcher_blind({ why: "It refused the key lemonfiber holds." }),
    );
    expect(told.entries).toStrictEqual([]);
    expect(
      watcherReadout({ reachable: false, read_at: 1 }).lines,
    ).toStrictEqual([
      m.watcher_nobody(),
      m.watcher_asked({ when: whenOf(1) }),
      m.watcher_blind({ why: m.watcher_blind_unsaid() }),
    ]);
  });
});

describe("one monitor", () => {
  it("says how it checks, what it sees, its last reading, the path and what it covers", () => {
    expect(monitorEntry(door)).toStrictEqual({
      head: door.name,
      lines: [
        m.watcher_kind_http(),
        m.watcher_up({ since: whenOf(door.since) }),
        m.watcher_read({ when: whenOf(1_791_400_500) }),
        m.watcher_path_household(),
        m.watcher_covers({ name: m.watcher_entry({ name: "jellyfin" }) }),
      ],
    });
  });

  it("says a heartbeat's interval, that it is not checking, and what it watches instead", () => {
    expect(monitorEntry(beat).lines).toStrictEqual([
      m.watcher_kind_heartbeat(),
      m.watcher_not_reporting({ since: whenOf(beat.since) }),
      m.watcher_inactive(),
      m.watcher_never_read(),
      m.watcher_heartbeat({ every: lasting(86_400), grace: lasting(600) }),
      m.watcher_never_checked_in(),
      m.watcher_covers({ name: m.watcher_job({ name: "backup" }) }),
      m.watcher_instead({ wanted: "the nightly backup", watches: "nothing" }),
      "The job has no address to check in at.",
    ]);
    const checkedIn: Monitor = {
      ...beat,
      unconfigured: null,
      covers: { service: "sonarr" },
      heartbeat: { every_s: 60, grace_s: 30, last_check_in: 5 },
    };
    expect(monitorEntry(checkedIn).lines).toContain(
      m.watcher_checked_in({ when: whenOf(5) }),
    );
    expect(coveredWord({ service: "sonarr" })).toBe("sonarr");
  });

  it("has words for every way of checking and every state, and says so of one it has none for", () => {
    const at = (kind: string, state: string): readonly string[] =>
      monitorEntry({
        name: "x",
        kind,
        state,
        since: 1,
        active: true,
        path: "internal",
      } as unknown as Monitor).lines;
    const since = whenOf(1);
    expect(at("keyword", "down").slice(0, 2)).toStrictEqual([
      m.watcher_kind_keyword(),
      m.watcher_down({ since }),
    ]);
    expect(at("port", "pending").slice(0, 2)).toStrictEqual([
      m.watcher_kind_port(),
      m.watcher_pending({ since }),
    ]);
    expect(at("ping", "paused").slice(0, 2)).toStrictEqual([
      m.watcher_kind_ping(),
      m.watcher_paused({ since }),
    ]);
    expect(at("dns", "expected-down").slice(0, 2)).toStrictEqual([
      m.watcher_kind_dns(),
      m.watcher_expected_down({ since }),
    ]);
    expect(at("docker", "sideways").slice(0, 2)).toStrictEqual([
      m.watcher_kind_docker(),
      m.watcher_state_other({ since }),
    ]);
    expect(at("sideways", "up")).toContain(m.watcher_kind_other());
    expect(at("http", "up")).toContain(m.watcher_path_internal());
  });
});
