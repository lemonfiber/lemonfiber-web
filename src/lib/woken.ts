/**
 * The phones that can be woken, in lines a reader can carry.
 *
 * Each is a push endpoint a phone registered under a name, so the stack can
 * wake it. Its address is the distributor's whole address, and whoever holds
 * it can wake the phone, so the host is all of it that is ever drawn. The words
 * around what lemonfiber says live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./instant";
import { said } from "./said";
import * as m from "../paraglide/messages.js";

/** Every phone that can be woken, and what a removal came to. */
export type Woken = ByKind["push-endpoints"]["data"];

/** One phone that can be woken, as the listing names it. */
export type Wakeable = Woken["endpoints"][number];

/** The host a phone is woken through, and nothing else of its address. */
export function hostOf(endpoint: string): string | undefined {
  try {
    const host = new URL(endpoint).host;
    return host === "" ? undefined : host;
  } catch {
    return undefined;
  }
}

/** One phone that can be woken, line by line. */
export function wakeableLines(phone: Wakeable): readonly string[] {
  const host = hostOf(phone.endpoint);
  return [
    host === undefined ? m.woken_host_unread() : m.woken_host({ host }),
    m.phones_registered({ when: whenOf(phone.registered) }),
  ];
}

/** What the removal just answered came to, where the listing is one. */
export function removedLine(woken: Woken | undefined): string | undefined {
  const name = woken?.removed;
  return said(name) ? m.woken_removed({ name }) : undefined;
}
