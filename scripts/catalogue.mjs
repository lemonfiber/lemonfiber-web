/**
 * Where this console's words are kept and how a screen reads one: the settings
 * the compiler is told, each locale's catalogue files, and the call a screen
 * draws a message with.
 */
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const SETTINGS = JSON.parse(
  readFileSync(join(ROOT, "project.inlang", "settings.json"), "utf8"),
);

/** Every catalogue file one locale is compiled from, in the order named. */
export const catalogueOf = (locale) =>
  [SETTINGS["plugin.inlang.messageFormat"].pathPattern]
    .flat()
    .map((pattern) => join(ROOT, pattern.replace("{locale}", locale)));

/** A message read inside an expression. */
export const MESSAGE = /\bm\.(\w+)\(/gu;

/** A file beside the screens rather than one they are drawn from. */
export const NOT_DRAWN =
  /(?:\.test\.ts|\.testing\.ts|\.stories\.ts)$|(?:^|\/)paraglide\//u;

/**
 * The text with every `{…}` removed, a placeholder being data inside a sentence,
 * or put in place of `standIn` where it is to be counted rather than read.
 *
 * What arrives in one is a release title, a service name, a path or a figure —
 * words this product did not write and cannot be answerable for.
 */
export function withoutPlaceholders(said, standIn = "") {
  let prose = "";
  let depth = 0;
  for (const character of said) {
    if (character === "{") {
      if (depth === 0) prose += standIn;
      depth += 1;
    } else if (character === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0) prose += character;
  }
  return prose;
}
