/**
 * What the stack holds: what each service is for and where it comes from, and
 * what the stack used to hold, in lines a reader can carry.
 *
 * Two readings about the same services. The catalogue says what each does,
 * what going without it costs, and how much its absence matters; the record of
 * where each comes from names the image, the exact tag and digest it is pinned
 * at, the licence it is published under and the project it is built from. The
 * two are read together by the id the stack declares each service under. A
 * service the stack has dropped is named with why, when, and what took its
 * place where anything did.
 *
 * What lemonfiber writes into either reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What each service is for, and what the stack has dropped. */
export type Catalogue = ByKind["catalogue"]["data"];

/** Where each service comes from. */
export type Provenance = ByKind["provenance"]["data"];

/** One service, as the catalogue declares it. */
export type Catalogued = Catalogue["services"][number];

/** Where one service comes from. */
export type Origin = Provenance["services"][number];

/** A service the stack used to carry. */
export type Dropped = Catalogue["removed"][number];

/** How much a service's absence matters, in a sentence. */
export function wordOfCriticality(
  criticality: Catalogued["criticality"],
): string {
  switch (criticality) {
    case "critical":
      return m.catalogue_critical();
    case "core":
      return m.catalogue_core();
    case "important":
      return m.catalogue_important();
    case "enhancing":
      return m.catalogue_enhancing();
    case "optional":
      return m.catalogue_optional();
    default:
      return m.catalogue_criticality_other();
  }
}

/** What one service is for, line by line. */
export function purposeLines(service: Catalogued): readonly string[] {
  return [
    service.describes,
    m.catalogue_without({ cost: service.without_it }),
    wordOfCriticality(service.criticality),
  ];
}

/** Where one service comes from, line by line. */
export function originLines(origin: Origin): readonly string[] {
  const lines = [
    m.catalogue_image({ image: origin.image, pinned: origin.pinned }),
  ];
  const { digest } = origin;
  if (digest !== undefined && digest !== null) {
    lines.push(m.catalogue_digest({ digest }));
  }
  lines.push(
    m.catalogue_license({ license: origin.license }),
    m.catalogue_upstream({ upstream: origin.upstream }),
  );
  return lines;
}

/**
 * One service, line by line: what it is for, then where it comes from where
 * that was read. The two readings name a service by the same id; one the
 * record of origins does not name says so.
 */
export function serviceLines(
  service: Catalogued,
  provenance: Provenance | undefined,
): readonly string[] {
  if (provenance === undefined) return purposeLines(service);
  const origin = provenance.services.find((one) => one.id === service.id);
  return [
    ...purposeLines(service),
    ...(origin === undefined
      ? [m.catalogue_origin_unread()]
      : originLines(origin)),
  ];
}

/** A service the stack dropped, in a sentence. */
export function droppedLine(dropped: Dropped): string {
  const said = {
    id: dropped.id,
    version: dropped.removed_in,
    reason: dropped.reason,
  };
  const { replaced_by: replaced } = dropped;
  return replaced === undefined || replaced === null
    ? m.catalogue_dropped(said)
    : m.catalogue_replaced({ ...said, by: replaced });
}
