/**
 * The phones that can be woken, in lines a reader can carry.
 *
 * Each is a push endpoint a phone registered under a name, so the stack can
 * wake it. Whoever holds its whole address can wake the phone, so lemonfiber
 * answers only the host the address reaches and a fingerprint of the whole,
 * which tells two phones woken through one host apart. The words around what
 * lemonfiber says live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./instant";
import { said } from "./said";
import * as m from "../paraglide/messages.js";

/** Every phone that can be woken, and what a removal came to. */
export type Woken = ByKind["push-endpoints"]["data"];

/** One phone that can be woken, as the listing names it. */
export type Wakeable = Woken["endpoints"][number];

/** One phone that can be woken, line by line. */
export function wakeableLines(phone: Wakeable): readonly string[] {
  return [
    said(phone.host)
      ? m.woken_host({ host: phone.host })
      : m.woken_host_unsaid(),
    m.phones_fingerprint({ fingerprint: phone.fingerprint }),
    m.phones_registered({ when: whenOf(phone.registered) }),
  ];
}

/** What the removal just answered came to, where the listing is one. */
export function removedLine(woken: Woken | undefined): string | undefined {
  const name = woken?.removed;
  return said(name) ? m.woken_removed({ name }) : undefined;
}
