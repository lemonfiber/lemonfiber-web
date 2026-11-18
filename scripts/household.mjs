#!/usr/bin/env node
/**
 * The words a member's screens show, held to what the contract says a member
 * may not be shown.
 *
 * A member's screens are `src/routes/Member.svelte` and every module it reaches
 * through a relative import. Each message they draw is read in the base locale
 * with its placeholders taken out, and refused where it names a service, a term
 * for how the stack is built and run, a size, a rate, an address or a version.
 * The lists are the contract's `household_words`, as the SDK ships them, so the
 * core and every surface hold a member's text to the one list.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { HOUSEHOLD_WORDS } from "@lemonfiber/sdk-ts/contract";
import {
  catalogueOf,
  MESSAGE,
  NOT_DRAWN,
  ROOT,
  SETTINGS,
  withoutPlaceholders,
} from "./catalogue.mjs";

/** Where a member's screens start. */
const MEMBER = join(ROOT, "src", "routes", "Member.svelte");

/** The relative module a statement names after `from`. */
const FROM = /\bfrom\s+"(\.{1,2}\/[^"]+)"/u;

/** A relative module loaded where it is needed. */
const LOADED = /\bimport\(\s*"(\.{1,2}\/[^"]+)"/gu;

/** A statement that brings a module in for what it runs, not only for its types. */
const BRINGS = /^(?:import|export)\s(?!\s*type\s)/u;

/** A statement from the line it opens on, past whatever markup comes before it. */
function opening(statement) {
  const lines = statement.split("\n").map((line) => line.trim());
  const at = lines.findLastIndex((line) => /^(?:import|export)\s/u.test(line));
  return at === -1 ? "" : lines.slice(at).join(" ");
}

/** Each relative module `source` imports for what it runs, not only for its types. */
function imported(source) {
  const named = source
    .split(";")
    .map(opening)
    .filter((statement) => BRINGS.test(statement))
    .map((statement) => FROM.exec(statement)?.[1])
    .filter((module) => module !== undefined);
  const loaded = [...source.matchAll(LOADED)].map(([, module]) => module);
  return [...named, ...loaded];
}

/** How few member messages the sweep may read before it is reading the wrong thing. */
const FLOOR_MESSAGES = 100;

/** Sentences a member may be shown, which every rule must let through. */
const HOUSEHOLD = [
  "It's on its way to the house",
  "Ask for it again in a moment",
  "Season 2 is on the shelf, and 3 more are coming",
  "Nothing is waiting for you",
];

const failures = [];
const fail = (where, message) => {
  failures.push(`${where}  ${message}`);
};

/** Ends the run with every violation found so far, where there is one. */
function report() {
  if (failures.length === 0) return;
  console.error(`household: ${String(failures.length)} violation(s)\n`);
  for (const found of failures) console.error(`  ${found}`);
  process.exit(1);
}

const words = HOUSEHOLD_WORDS;
for (const list of ["names", "terms", "sizes", "marks", "examples"])
  if (!Array.isArray(words[list]) || words[list].length === 0)
    fail(
      "@lemonfiber/sdk-ts",
      `HOUSEHOLD_WORDS.${list} is empty — the SDK does not carry the contract's household words`,
    );
report();

/** Whether `term`, which may be several words, is said among `said`. */
function spoken(said, term) {
  const wanted = term.split(" ");
  for (let at = 0; at + wanted.length <= said.length; at += 1)
    if (wanted.every((word, offset) => said[at + offset] === word)) return true;
  return false;
}

/** Whether `token` reads as a version or an address. */
function versioned(token) {
  const parts = token.replace(/^v/u, "").split(".");
  return parts.length >= 2 && parts.every((part) => /^\d+$/u.test(part));
}

/** A letter or a digit. */
const WORDLIKE = /[\p{L}\p{N}]/u;

/** What a bare token reads as with the punctuation around it taken off. */
function bare(token) {
  const chars = [...token];
  const first = chars.findIndex((char) => WORDLIKE.test(char));
  if (first === -1) return "";
  const last = chars.findLastIndex((char) => WORDLIKE.test(char));
  return chars.slice(first, last + 1).join("");
}

/** How many lowercase letters `token` ends with. */
function trailingLetters(token) {
  let count = 0;
  while (count < token.length && /[a-z]/u.test(token[token.length - 1 - count]))
    count += 1;
  return count;
}

/** What in `text` a member may not be shown, or nothing where it is all household words. */
function unhoused(text) {
  const lower = text.toLowerCase();
  const said = lower.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  const term = [...words.names, ...words.terms].find((named) =>
    spoken(said, named),
  );
  if (term !== undefined) return term;
  const tokens = lower.split(/\s+/u).filter(Boolean);
  for (const [at, raw] of tokens.entries()) {
    const token = bare(raw);
    if (versioned(token)) return token;
    const digits = token.slice(0, token.length - trailingLetters(token));
    const unit = token.slice(digits.length);
    const next =
      tokens[at + 1] === undefined
        ? undefined
        : bare(tokens[at + 1].split("/")[0]);
    if (
      /^[\d.]+$/u.test(digits) &&
      (words.sizes.includes(unit) || words.sizes.includes(next))
    )
      return token;
  }
  return words.marks.find((mark) => lower.includes(mark));
}

for (const { text, names } of words.examples) {
  const found = unhoused(text);
  if (found !== names)
    fail(
      "the rules",
      `read "${text}" as naming ${JSON.stringify(found)}, where the contract says it names "${names}"`,
    );
}
for (const text of HOUSEHOLD) {
  const found = unhoused(text);
  if (found !== undefined)
    fail("the rules", `refused "${text}" for "${found}", a household sentence`);
}

/** The file a relative import names, as the bundler resolves it. */
function resolved(from, specifier) {
  const named = resolve(dirname(from), specifier);
  return [
    named,
    named.replace(/\.js$/u, ".ts"),
    `${named}.ts`,
    join(named, "index.ts"),
  ].find((path) => /\.(?:svelte|ts)$/u.test(path) && existsSync(path));
}

/** Every module a member's screens are drawn from. */
const reached = new Set();
const waiting = [MEMBER];
while (waiting.length > 0) {
  const file = waiting.pop();
  if (reached.has(file) || NOT_DRAWN.test(file)) continue;
  reached.add(file);
  for (const module of imported(readFileSync(file, "utf8"))) {
    const next = resolved(file, module);
    if (next !== undefined) waiting.push(next);
  }
}

const base = new Map(
  catalogueOf(SETTINGS.baseLocale).flatMap((path) =>
    Object.entries(JSON.parse(readFileSync(path, "utf8"))),
  ),
);

/** Each message a member's screens draw, with the first module drawing it. */
const drawn = new Map();
for (const file of reached)
  for (const [, key] of readFileSync(file, "utf8").matchAll(MESSAGE))
    if (!drawn.has(key)) drawn.set(key, relative(ROOT, file));

if (drawn.size < FLOOR_MESSAGES)
  fail(
    "the sweep",
    `read ${String(drawn.size)} member messages, under the floor of ${String(FLOOR_MESSAGES)} — it is reading the wrong files, or no longer finds a member's screens`,
  );

for (const [key, where] of drawn) {
  const message = base.get(key);
  if (message === undefined) continue;
  const found = unhoused(withoutPlaceholders(message));
  if (found !== undefined)
    fail(
      `${key}  (${where})`,
      `"${found}" is shown on a member's screen — say it in household words, and call the stack the house`,
    );
}

report();
console.log(
  `household: clean (${String(drawn.size)} member messages from ${String(reached.size)} modules)`,
);
