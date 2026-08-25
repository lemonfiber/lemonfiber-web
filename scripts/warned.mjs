/**
 * The Svelte compiler warnings this surface refuses to build.
 *
 * The compiler reads the markup it is given and says so when a control only a
 * pointer can reach — a `<div>` carrying a click handler, with no keyboard
 * handler, no role and no place in the tab order. Nothing was reading what it
 * said, so the warning was printed and the build went on.
 *
 * The whole `a11y_` family is refused rather than a list of codes, so a code a
 * later Svelte adds arrives already refused.
 */

/** Every accessibility warning the compiler emits, the ones not yet written included. */
const FAMILY = /^a11y_/;

/** A dependency's own markup, which is not this repository's to change. */
const THEIRS = "node_modules";

/**
 * The last line of a warning's message, which is the documentation link. The
 * code is printed beside the message and the link is that code appended to
 * `https://svelte.dev/e/`, so the refusal keeps one line per warning.
 */
const LINK = /\n[^\n]*$/;

/** Whether a compiler warning is one this surface refuses to build. */
export function refuses(warning) {
  return (
    FAMILY.test(warning.code) && !(warning.filename ?? "").includes(THEIRS)
  );
}

/** Where a refused warning was raised, as a path and a line. */
export function raisedAt(warning) {
  const where = warning.filename ?? "unknown";
  return warning.start === undefined
    ? where
    : `${where}:${String(warning.start.line)}`;
}

/** What a refused warning says: its code, and the sentence behind it. */
export function refusal(warning) {
  return `${warning.code}: ${warning.message.replace(LINK, "")}`;
}
