/**
 * Where alerts go: every back-end the stack delivers to, how far each is
 * proven, what it last delivered and every failure since its last confirmed
 * delivery.
 *
 * Where a back-end reaches is named by its host and topic or path, which the
 * stack writes with no credential in it; nothing here adds one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { notificationWords } from "./alerts";
import { whenOf } from "./instant";
import { listed } from "./listed";
import { given, type Entry, type Readout } from "./readout";
import * as m from "../paraglide/messages.js";

/** Where alerts go. */
export type Notified = ByKind["notify"]["data"];

/** One back-end. */
export type Backend = Notified["backends"][number];

/** One delivery to one back-end. */
export type Delivery = Backend["failures"][number];

/** Where delivery as a whole stands, in a sentence. */
function stateLine(state: Notified["state"]): string {
  switch (state) {
    case "unconfigured":
      return m.notify_unconfigured();
    case "ready":
      return m.notify_ready();
    case "degraded":
      return m.notify_degraded();
    case "unreachable":
      return m.notify_unreachable();
    default:
      return m.notify_state_other();
  }
}

/** What a back-end speaks, in words. */
function kindWord(kind: Backend["kind"]): string {
  switch (kind) {
    case "ntfy":
      return m.notify_kind_ntfy();
    case "gotify":
      return m.notify_kind_gotify();
    case "webhook":
      return m.notify_kind_webhook();
    case "apprise":
      return m.notify_kind_apprise();
    case "unifiedpush":
      return m.notify_kind_unifiedpush();
    default:
      return m.notify_kind_other();
  }
}

/** Who chose a back-end, in a sentence. */
function chosenLine(chosen: Backend["chosen_by"]): string {
  return typeof chosen === "string"
    ? m.notify_chosen_operator()
    : m.notify_chosen_member({ member: chosen.member });
}

/** How far a back-end is proven, in a sentence. */
function proofLine(proof: Backend["proof"]): string {
  if (typeof proof === "string") return m.notify_unproven();
  if ("proven" in proof) return m.notify_proven({ when: whenOf(proof.proven) });
  return m.notify_held({ why: proof.held });
}

/** One delivery, in a sentence. */
export function deliveryLine(delivery: Delivery): string {
  const when = whenOf(delivery.at);
  const kind = notificationWords(delivery.kind);
  const { outcome } = delivery;
  if (outcome === "confirmed") return m.notify_confirmed({ when, kind });
  if (outcome === "sent") return m.notify_sent({ when, kind });
  if (typeof outcome === "string")
    return m.notify_outcome_other({ when, kind });
  return m.notify_delivery_failed({ when, kind, said: outcome.failed });
}

/** One back-end, as the entry a reading lists. */
export function backendEntry(backend: Backend): Entry {
  const lines = [
    m.notify_reaches({ kind: kindWord(backend.kind), where: backend.where }),
    chosenLine(backend.chosen_by),
    proofLine(backend.proof),
  ];
  if (given(backend.hosted)) {
    const { host, leaves } = backend.hosted;
    lines.push(m.notify_hosted({ host, leaves: listed(leaves) }));
  }
  lines.push(
    given(backend.last)
      ? deliveryLine(backend.last)
      : m.notify_never_delivered(),
    ...backend.failures.map(deliveryLine),
  );
  if (given(backend.retry)) {
    const { attempt, of, next } = backend.retry;
    lines.push(m.notify_retry({ attempt, of, when: whenOf(next) }));
  }
  return { head: backend.id, lines };
}

/** Where alerts go, told. */
export function notifiedReadout(notified: Notified): Readout {
  return {
    lines: [
      stateLine(notified.state),
      ...notified.unread.map(({ backend, because }) =>
        m.notify_unread({ backend, because }),
      ),
    ],
    entries: notified.backends.map(backendEntry),
  };
}
