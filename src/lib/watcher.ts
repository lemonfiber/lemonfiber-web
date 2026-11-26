/**
 * What watches the stack from outside it: the plugin that does, whether it
 * answers, what each of its monitors sees, and what no monitor covers.
 *
 * A watcher that does not answer is coverage nobody can see. It is said as
 * that, with why, and never as nothing wrong.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { stamped, whenOf } from "./instant";
import { listed } from "./listed";
import { given, lasting, type Entry, type Readout } from "./readout";
import * as m from "../paraglide/messages.js";

/** What watches the stack from outside it, and what it sees. */
export type Watcher = ByKind["watcher"]["data"];

/** One monitor. */
export type Monitor = NonNullable<Watcher["monitors"]>[number];

/** What a monitor covers, or what no monitor does. */
export type Covered = NonNullable<Monitor["covers"]>;

/** How a monitor checks, in words. */
function kindWord(kind: Monitor["kind"]): string {
  switch (kind) {
    case "http":
      return m.watcher_kind_http();
    case "keyword":
      return m.watcher_kind_keyword();
    case "port":
      return m.watcher_kind_port();
    case "ping":
      return m.watcher_kind_ping();
    case "dns":
      return m.watcher_kind_dns();
    case "docker":
      return m.watcher_kind_docker();
    case "heartbeat":
      return m.watcher_kind_heartbeat();
    default:
      return m.watcher_kind_other();
  }
}

/** What a monitor sees, in a sentence, since when. */
function stateLine(monitor: Monitor): string {
  const since = whenOf(monitor.since);
  switch (monitor.state) {
    case "up":
      return m.watcher_up({ since });
    case "down":
      return m.watcher_down({ since });
    case "pending":
      return m.watcher_pending({ since });
    case "paused":
      return m.watcher_paused({ since });
    case "expected-down":
      return m.watcher_expected_down({ since });
    case "not-reporting":
      return m.watcher_not_reporting({ since });
    default:
      return m.watcher_state_other({ since });
  }
}

/** What a monitor covers, by the name the stack gives it. */
export function coveredWord(covered: Covered): string {
  if ("service" in covered) return covered.service;
  if ("entry-point" in covered) {
    return m.watcher_entry({ name: covered["entry-point"] });
  }
  return m.watcher_job({ name: covered.job });
}

/** One monitor, as the entry a reading lists. */
export function monitorEntry(monitor: Monitor): Entry {
  const lines = [kindWord(monitor.kind), stateLine(monitor)];
  if (!monitor.active) lines.push(m.watcher_inactive());
  lines.push(
    stamped(monitor.last_reading)
      ? m.watcher_read({ when: whenOf(monitor.last_reading) })
      : m.watcher_never_read(),
  );
  if (given(monitor.heartbeat)) {
    const beat = monitor.heartbeat;
    lines.push(
      m.watcher_heartbeat({
        every: lasting(beat.every_s),
        grace: lasting(beat.grace_s),
      }),
      stamped(beat.last_check_in)
        ? m.watcher_checked_in({ when: whenOf(beat.last_check_in) })
        : m.watcher_never_checked_in(),
    );
  }
  if (given(monitor.path)) {
    lines.push(
      monitor.path === "household"
        ? m.watcher_path_household()
        : m.watcher_path_internal(),
    );
  }
  if (given(monitor.covers)) {
    lines.push(m.watcher_covers({ name: coveredWord(monitor.covers) }));
  }
  if (given(monitor.unconfigured)) {
    const { wanted, watches, why } = monitor.unconfigured;
    lines.push(m.watcher_instead({ wanted, watches }), why);
  }
  return { head: monitor.name, lines };
}

/** What watches the stack from outside it, told. */
export function watcherReadout(watcher: Watcher): Readout {
  const lines = [
    given(watcher.watcher)
      ? m.watcher_by({ plugin: watcher.watcher })
      : m.watcher_nobody(),
    m.watcher_asked({ when: whenOf(watcher.read_at) }),
  ];
  if (!watcher.reachable) {
    lines.push(
      m.watcher_blind({
        why: watcher.unreachable_because ?? m.watcher_blind_unsaid(),
      }),
    );
  }
  const uncovered = watcher.uncovered ?? [];
  if (uncovered.length > 0) {
    lines.push(
      m.watcher_uncovered({ names: listed(uncovered.map(coveredWord)) }),
    );
  }
  return { lines, entries: (watcher.monitors ?? []).map(monitorEntry) };
}
