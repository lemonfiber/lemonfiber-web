/**
 * Starting with the machine: when it last started, what the check after that
 * start came to, and how long the stack has failed to come back.
 *
 * A check is said against the start it names. Where none ran after the latest
 * start, the newest one is said as the check after an earlier start, never as
 * the check after this one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { stamped, whenOf } from "./instant";
import { listed } from "./listed";
import { given, type Readout } from "./readout";
import * as m from "../paraglide/messages.js";

/** When this machine last started, and what the checks after it came to. */
export type Boot = ByKind["boot"]["data"];

/** What one check after a start came to. */
export type Verification = NonNullable<Boot["verified"]>;

/** What a check came to, in a sentence. */
function outcomeLine(outcome: Verification["outcome"]): string {
  switch (outcome) {
    case "passed":
      return m.boot_passed();
    case "failed":
      return m.boot_failed();
    case "waiting-for-install":
      return m.boot_waiting();
    default:
      return m.boot_outcome_other();
  }
}

/** Whether the tunnel came back, in a sentence. */
function tunnelLine(tunnel: Verification["tunnel"]): string {
  switch (tunnel.state) {
    case "held":
      return m.boot_tunnel_held();
    case "not-established":
      return m.boot_tunnel_lost({ said: tunnel.said });
    case "not-checked":
      return m.boot_tunnel_unchecked();
    default:
      return m.boot_tunnel_other();
  }
}

/** A port, or that there was none. */
function portOf(port: number | null | undefined): string {
  return given(port) ? String(port) : m.boot_port_none();
}

/** The forwarded port across the start, where the stack forwards one. */
function portLines(port: Verification["port"]): readonly string[] {
  if (!given(port)) return [];
  const lines = [m.boot_port({ was: portOf(port.was), now: portOf(port.now) })];
  if (!port.pushed) lines.push(m.boot_port_unpushed());
  return lines;
}

/** What one check came to, line by line. */
export function verificationLines(check: Verification): readonly string[] {
  const lines = [
    m.boot_checked({ when: whenOf(check.at) }),
    outcomeLine(check.outcome),
  ];
  const missing = check.not_back ?? [];
  if (missing.length > 0)
    lines.push(m.boot_not_back({ names: listed(missing) }));
  lines.push(tunnelLine(check.tunnel), ...portLines(check.port));
  if (given(check.said)) lines.push(check.said);
  return lines;
}

/** Which start an earlier check was against, in a sentence. */
function againstLine(check: Verification): string {
  return stamped(check.against)
    ? m.boot_earlier({ when: whenOf(check.against) })
    : m.boot_earlier_unsaid();
}

/** The checks kept, as the entries a reading lists. */
function checksOf(boot: Boot): Readout["entries"] {
  if (given(boot.verified)) {
    return [
      { head: m.boot_after_latest(), lines: verificationLines(boot.verified) },
    ];
  }
  if (given(boot.last_verified)) {
    const check = boot.last_verified;
    return [{ head: againstLine(check), lines: verificationLines(check) }];
  }
  return [];
}

/** Starting with the machine, told. */
export function bootReadout(boot: Boot): Readout {
  const lines = [
    stamped(boot.booted_at)
      ? m.boot_started({ when: whenOf(boot.booted_at) })
      : m.boot_started_unsaid(),
  ];
  if (stamped(boot.failing_since)) {
    const since = whenOf(boot.failing_since);
    lines.push(
      given(boot.failed_boots)
        ? m.boot_failing_for({ since, count: boot.failed_boots })
        : m.boot_failing({ since }),
    );
  }
  if (given(boot.declined)) lines.push(m.boot_declined({ why: boot.declined }));
  const entries = checksOf(boot);
  if (entries.length === 0) lines.push(m.boot_none());
  else if (!given(boot.verified)) lines.push(m.boot_none_after());
  return { lines, entries };
}
