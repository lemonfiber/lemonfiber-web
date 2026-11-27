/**
 * How this machine stands, in words: how the console itself is served, how the
 * stack runs without lemonfiber, and what setup settled.
 *
 * Every name the stack hands over, a subject, an issuer, a covered name or a
 * path, is said as the stack gave it, as plain text, and one the stack cut
 * short is marked as shortened.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { dayOf } from "./instant";
import { listed } from "./listed";
import { given, type Command, type Entry, type Readout } from "./readout";
import * as m from "../paraglide/messages.js";

/** How the console itself is served. */
export type Served = ByKind["served"]["data"];

/** The certificate the console is served under. */
export type Certificate = NonNullable<Served["certificate"]>;

/** How the stack runs without lemonfiber. */
export type Stack = ByKind["stack"]["data"];

/** What setup settled. */
export type Settled = ByKind["settled"]["data"];

/** A name the stack gave, and whether the stack cut it short. */
export interface Given {
  readonly text: string;
  readonly cut: boolean;
}

/** A name the stack gave, marked where it was cut short. */
export function shortened(given: Given): string {
  return given.cut ? m.machine_shortened({ text: given.text }) : given.text;
}

/**
 * Whether the console is served without encryption to the network, which
 * anyone on the path can read.
 */
export function readableOnThePath(served: Served): boolean {
  return !served.encrypted && served.network;
}

/** Whether the console is encrypted, and who it is offered to, in a line. */
function reachLine(served: Served): string {
  if (readableOnThePath(served)) return m.served_plain_network();
  if (!served.encrypted) return m.served_plain_local();
  return served.network ? m.served_network() : m.served_local();
}

/** The certificate, as an entry of its own. */
function certificateEntry(certificate: Certificate): Entry {
  const names =
    certificate.names_more > 0
      ? m.served_names_more({
          names: listed(certificate.names),
          count: certificate.names_more,
        })
      : m.served_names({ names: listed(certificate.names) });
  return {
    head: m.served_certificate(),
    lines: [
      m.served_fingerprint({ fingerprint: certificate.fingerprint }),
      m.served_compare(),
      m.served_subject({
        subject: shortened({
          text: certificate.subject,
          cut: certificate.subject_cut,
        }),
      }),
      certificate.self_signed
        ? m.served_self_signed()
        : m.served_issuer({
            issuer: shortened({
              text: certificate.issuer,
              cut: certificate.issuer_cut,
            }),
          }),
      names,
      m.served_valid({
        from: dayOf(certificate.valid_from),
        until: dayOf(certificate.valid_until),
      }),
    ],
  };
}

/** How the console itself is served, told. */
export function servedReadout(served: Served): Readout {
  const lines = [m.served_port({ port: served.port }), reachLine(served)];
  if (given(served.named)) lines.push(m.served_named({ name: served.named }));
  if (given(served.unrecorded)) {
    lines.push(m.served_unrecorded({ reason: served.unrecorded }));
  }
  const certificate = served.certificate ?? undefined;
  return {
    lines,
    entries: certificate === undefined ? [] : [certificateEntry(certificate)],
  };
}

/** A single quote inside a quoted word: the quoting closed, the quote, and reopened. */
const INNER_QUOTE = `'"'"'`;

/** One word, quoted for a POSIX shell where it would otherwise be split or read. */
export function quoted(word: string): string {
  if (/^[\w@%+=:,./-]+$/.test(word)) return word;
  return `'${word.replaceAll("'", INNER_QUOTE)}'`;
}

/** How the stack runs without lemonfiber, told. */
export function stackReadout(stack: Stack): Readout {
  const commands: Command[] = [
    { label: m.stack_up(), text: stack.plain_up.map(quoted).join(" ") },
    { label: m.stack_quiet(), text: stack.non_interactive.form },
  ];
  return {
    lines: [
      stack.source === "bundled"
        ? m.stack_bundled()
        : m.stack_own({ path: stack.source.own }),
      m.stack_project({ path: stack.project }),
      m.stack_env({ path: stack.env }),
    ],
    entries: stack.exceptions.map((exception) => ({
      head: exception.part,
      lines: [exception.because],
    })),
    commands,
  };
}

/** Where the user the services run as came from, in a line. */
function userLine(user: Settled["service_user"]): string {
  const ids = { uid: user.uid, gid: user.gid };
  switch (user.from) {
    case "set":
      return m.settled_user_set(ids);
    case "part-set":
      return m.settled_user_part(ids);
    case "stack-owner":
      return m.settled_user_owner(ids);
  }
}

/** Whether the stack is set up, in a line. */
function setUpLine(setup: Settled["setup"]): string {
  switch (setup) {
    case "done":
      return m.settled_done();
    case "part-way":
      return m.settled_part_way();
    case "none":
      return m.settled_none();
  }
}

/** What setup settled, told. */
export function settledReadout(settled: Settled): Readout {
  return {
    lines: [
      given(settled.data_root)
        ? m.settled_root({ path: settled.data_root })
        : m.settled_no_root(),
      settled.protocols.usenet ? m.settled_usenet() : m.settled_no_usenet(),
      settled.protocols.torrent ? m.settled_torrent() : m.settled_no_torrent(),
      userLine(settled.service_user),
      setUpLine(settled.setup),
    ],
    entries: [],
  };
}
