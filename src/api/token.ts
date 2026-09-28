/**
 * Where the key lives, whose it is, and how long both live for.
 *
 * Every request carries one secret in one header: the key the binary minted and
 * printed once per run, or the session a password was exchanged for. There is
 * no cookie and no discovery: the page is given the key by whoever read it off
 * the terminal, or given the session by the door it signed in at.
 *
 * A session a household member signed in for comes with the member it is for,
 * and that is kept beside it. It is lemonfiber's answer to who signed in, and it
 * is what decides which of the two surfaces the page draws after a reload. It is
 * no permission: lemonfiber decides what every request may have from the session
 * the request carries, whatever this page believes about it.
 *
 * Both are kept in the tab's own session storage. A reload keeps them, so a
 * stream that reconnects does not stop to ask again; closing the tab loses them,
 * which is the same lifetime the key itself has. Nothing writes them to disk for
 * the next boot, and no other origin can read them.
 *
 * Neither reaches the address. A query string reaches server logs, browser
 * history and the referrer; a fragment reaches history and whatever the operator
 * pastes. The client refuses an address carrying either.
 */

/** What the key is filed under. */
const KEPT = "lemonfiber-key";

/** What the member a session is for is filed under. */
const WHOSE = "lemonfiber-member";

/**
 * The key this tab was given, where it still has one.
 */
export function remembered(store: Storage): string | undefined {
  return store.getItem(KEPT) ?? undefined;
}

/**
 * The household member this tab's session is for, where it is a member's.
 */
export function memberOf(store: Storage): string | undefined {
  return store.getItem(WHOSE) ?? undefined;
}

/**
 * Keep a key for as long as this tab is open, and the member it is for where
 * it is a member's.
 */
export function remember(store: Storage, token: string, member?: string): void {
  store.setItem(KEPT, token);
  if (member === undefined) store.removeItem(WHOSE);
  else store.setItem(WHOSE, member);
}

/**
 * Forget the key and whose it was, for a run that has refused it.
 */
export function forget(store: Storage): void {
  store.removeItem(KEPT);
  store.removeItem(WHOSE);
}
