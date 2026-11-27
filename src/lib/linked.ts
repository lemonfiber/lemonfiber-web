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

/** The highest code a space or a control character below the printable ones has. */
const SPACE = 0x20;

/** Where the control characters after the printable ones begin and end. */
const DELETE = 0x7f;
const LAST_CONTROL = 0x9f;

/** Whether an address carries a space or a control character, which none does. */
function unprinted(address: string): boolean {
  for (let at = 0; at < address.length; at += 1) {
    const code = address.charCodeAt(at);
    if (code <= SPACE || (code >= DELETE && code <= LAST_CONTROL)) return true;
  }
  return false;
}

/** The address itself, where it may be opened as a link, or nothing where not. */
export function linkable(address: string): string | undefined {
  if (unprinted(address)) return undefined;
  try {
    return OPENED.has(new URL(address).protocol) ? address : undefined;
  } catch {
    return undefined;
  }
}
