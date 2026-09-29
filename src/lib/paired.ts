/**
 * Pairing material for a phone, in lines a record can carry.
 *
 * Pairing material names the address the phone reaches, the certificate that
 * address presents, when the material stops being good and the stack's own
 * identifier. It carries no credential: the phone still signs in with the
 * operator's own. What would make every paired phone refuse this machine is
 * said beside it, now rather than when it happens. The short form of the
 * fingerprint a person compares with the phone comes with it, worked out by
 * lemonfiber rather than here.
 *
 * What lemonfiber writes into the material and the report is its own and is
 * passed through unchanged. The words around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Pairing material, and what the operator is told beside it. */
export type Paired = ByKind["pairing"]["data"];

/** What making pairing material came to, line by line. */
export function pairingLines(report: Paired): readonly string[] {
  const lines: string[] = [
    m.came_pairing_address({ address: report.material.address }),
    m.came_pairing_until({ until: report.until }),
  ];
  if (report.caution !== undefined && report.caution !== null) {
    lines.push(report.caution);
  }
  lines.push(report.replacing);
  return lines;
}
