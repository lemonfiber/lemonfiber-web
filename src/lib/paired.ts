/**
 * Pairing material for a phone, and the short form of its fingerprint a person
 * compares, in lines a record can carry.
 *
 * Pairing material names the address the phone reaches, the certificate that
 * address presents, when the material stops being good and the stack's own
 * identifier. It carries no credential: the phone still signs in with the
 * operator's own. What would make every paired phone refuse this machine is
 * said beside it, now rather than when it happens.
 *
 * What lemonfiber writes into the material and the report is its own and is
 * passed through unchanged. The words around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Pairing material, and what the operator is told beside it. */
export type Paired = ByKind["pairing"]["data"];

/** The letters the short form is written in, which leave out letters easily taken for others. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * The short form of a certificate's fingerprint a person compares at a glance.
 *
 * Derived the one way it is derived wherever it is shown: SHA-256 over the
 * fingerprint as its sixty-four lower-case hexadecimal characters, the first
 * sixteen bytes of that digest each taken modulo thirty-two into the alphabet
 * above, written as four groups of four joined by hyphens. Every byte of the
 * fingerprint reaches the digest, so two certificates do not share a form.
 */
export async function comparableForm(fingerprint: string): Promise<string> {
  const written = new TextEncoder().encode(fingerprint.toLowerCase());
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", written));
  const letters = [...digest.subarray(0, 16)].map((byte) =>
    ALPHABET.charAt(byte % ALPHABET.length),
  );
  return [0, 4, 8, 12]
    .map((from) => letters.slice(from, from + 4).join(""))
    .join("-");
}

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
