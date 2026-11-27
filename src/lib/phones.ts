/**
 * The phones' hardware keys, in lines a reader can carry.
 *
 * Each is a key pair a phone made and keeps, registered so the phone can prove
 * the operator when a key is minted. It is named, with the app that made it,
 * the fingerprint of its public half, where it lives as the phone's attestation
 * said, when it was registered, when it last proved a mint and when it was
 * revoked where it was. The words around what lemonfiber says live in
 * `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { stamped, whenOf } from "./instant";
import { said } from "./said";
import * as m from "../paraglide/messages.js";

/** Every phone's hardware key, and what a revoke came to. */
export type Phones = ByKind["device-keys"]["data"];

/** One phone's hardware key, as the listing names it. */
export type Phone = Phones["keys"][number];

/** Where a phone keeps its key, in a sentence. */
export function backingLine(backing: Phone["backing"]): string {
  switch (backing) {
    case "strongbox":
      return m.phones_strongbox();
    case "enclave":
      return m.phones_enclave();
    case "tee":
      return m.phones_tee();
    default:
      return m.phones_backing_other();
  }
}

/** Whether a phone's key still proves the operator, and so may be revoked. */
export function standing(phone: Phone): boolean {
  return !stamped(phone.revoked);
}

/** One phone's hardware key, line by line. */
export function phoneLines(phone: Phone): readonly string[] {
  const lines: string[] = [
    m.phones_app({ app: phone.app }),
    m.phones_fingerprint({ fingerprint: phone.fingerprint }),
    backingLine(phone.backing),
    m.phones_registered({ when: whenOf(phone.registered) }),
    stamped(phone.used)
      ? m.phones_used({ when: whenOf(phone.used) })
      : m.phones_never_used(),
  ];
  if (stamped(phone.revoked)) {
    lines.push(m.keys_revoked_at({ when: whenOf(phone.revoked) }));
  }
  return lines;
}

/** What the revoke just answered came to, where the listing is one. */
export function revokedLine(phones: Phones | undefined): string | undefined {
  const name = phones?.revoked;
  return said(name) ? m.phones_revoked({ name }) : undefined;
}
