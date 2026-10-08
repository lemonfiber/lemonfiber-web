/**
 * Where getting one person's device onto the media server stands, in lines a
 * reader can carry.
 *
 * A hand-off is asked for by name. It says where it stands: the person has no
 * account yet, a code is ready, the person has the code and has not signed in
 * yet, a device has signed in, or it failed and why. A code still waiting on
 * the person is pending, never failed. Each app a device can use comes with
 * the code that points it at the server, flagged where the app is not open
 * source, and the steps the person takes are said in lemonfiber's words. What
 * there is to do next is named by lemonfiber and said here in this console's
 * own words.
 *
 * The code is an address and nothing more: whoever holds it still has to sign
 * in as somebody.
 *
 * What lemonfiber writes into the report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./history";
import * as m from "../paraglide/messages.js";

/** Where one person's hand-off stands. */
export type Handoff = ByKind["handoff"]["data"];

/** One app a device can be pointed at the server with. */
export type HandoffClient = Handoff["clients"][number];

/** One device signed in to the person's account. */
export type HandoffSession = Handoff["sessions"][number];

/** What there is to do next, as lemonfiber names it. */
export type Remedy = NonNullable<Handoff["remedy"]>;

/** Where a hand-off stands, in a sentence. */
export function stateLine(handoff: Handoff): string {
  const { name } = handoff;
  switch (handoff.state) {
    case "unprovisioned":
      return m.handoff_unprovisioned({ name });
    case "ready":
      return m.handoff_ready({ name });
    case "pending":
      return m.handoff_pending({ name });
    case "connected":
      return m.handoff_connected({ name });
    case "failed":
      return m.handoff_failed({ name });
    default:
      return m.handoff_state_other({ name });
  }
}

/** What there is to do next, in this console's words. */
export function remedyLine(remedy: Remedy, name: string): string {
  switch (remedy) {
    case "invite":
      return m.handoff_remedy_invite({ name });
    case "ask-again":
      return m.handoff_remedy_ask_again({ name });
    case "start-server":
      return m.handoff_remedy_start_server();
    case "record-address":
      return m.handoff_remedy_record_address();
    default:
      return m.handoff_remedy_other();
  }
}

/** A value lemonfiber may leave out, kept where it says something. */
function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}

/** Where a hand-off stands, line by line, before its apps and steps. */
export function handoffLines(handoff: Handoff): readonly string[] {
  const lines = [stateLine(handoff)];
  if (said(handoff.reason)) lines.push(handoff.reason);
  if (said(handoff.address)) {
    lines.push(m.handoff_address({ address: handoff.address }));
  }
  if (said(handoff.caution)) lines.push(handoff.caution);
  if (said(handoff.issued)) {
    lines.push(m.handoff_issued({ when: whenOf(handoff.issued) }));
  }
  if (handoff.quick_connect) {
    lines.push(m.handoff_quick_connect({ name: handoff.name }));
  }
  const { remedy } = handoff;
  if (remedy !== undefined && remedy !== null) {
    lines.push(remedyLine(remedy, handoff.name));
  }
  return lines;
}

/** One app, in a line: the device, the app, and whether it is open source. */
export function clientLine(client: HandoffClient): string {
  const said = { device: client.device, client: client.client };
  return client.open_source
    ? m.handoff_client(said)
    : m.handoff_client_closed(said);
}

/** What one app's code carries, in a line. */
export function codeLine(client: HandoffClient): string {
  return client.deep_link
    ? m.handoff_code_link({ code: client.code })
    : m.handoff_code_address({ code: client.code });
}

/** One device signed in, in a line. */
export function sessionLine(session: HandoffSession): string {
  const { last_seen: seen } = session;
  const named = { device: session.device, client: session.client };
  return said(seen)
    ? m.handoff_session_seen({ ...named, when: whenOf(seen) })
    : m.handoff_session(named);
}
