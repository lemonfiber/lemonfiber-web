/**
 * Whether an address the stack handed over may be opened as a link.
 *
 * Only a web address is: one that parses whole, with nothing around it, under
 * `http:` or `https:`. The core builds the front door's addresses under those
 * two alone, so anything else — a script, inline data, an address relative to
 * this page, one with spaces or control characters in it — is no address to
 * open, and is not linked.
 */

/** The schemes an address may be opened under. */
const OPENED: ReadonlySet<string> = new Set(["http:", "https:"]);

/** Any space or control character, which no address carries. */
const UNPRINTED = /[\p{Cc}\s]/u;

/** The address itself, where it may be opened as a link, or nothing where not. */
export function linkable(address: string): string | undefined {
  if (UNPRINTED.test(address)) return undefined;
  try {
    return OPENED.has(new URL(address).protocol) ? address : undefined;
  } catch {
    return undefined;
  }
}
