/**
 * Where the key lives, and how long it lives for.
 *
 * The binary mints a secret once per run, prints it, and expects it back in a
 * header on every request. There is no cookie, no session and no discovery: the
 * page is given the key by whoever read it off the terminal.
 *
 * It is kept in the tab's own session storage. A reload keeps it, so a stream
 * that reconnects does not stop to ask again; closing the tab loses it, which is
 * the same lifetime the key itself has. Nothing writes it to disk for the next
 * boot, and no other origin can read it.
 *
 * It never reaches the address. A query string reaches server logs, browser
 * history and the referrer; a fragment reaches history and whatever the operator
 * pastes. The client refuses an address carrying either.
 */

/** What the key is filed under. */
const KEPT = "lemonfiber-key";

/**
 * The key this tab was given, where it still has one.
 */
export function remembered(store: Storage): string | undefined {
  return store.getItem(KEPT) ?? undefined;
}

/**
 * Keep a key for as long as this tab is open.
 */
export function remember(store: Storage, token: string): void {
  store.setItem(KEPT, token);
}

/**
 * Forget the key, for a run that has refused it.
 */
export function forget(store: Storage): void {
  store.removeItem(KEPT);
}
