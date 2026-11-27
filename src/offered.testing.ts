/**
 * What the suites measuring the console's offer read with: every file under
 * `src` as written, what the page imports from its entry, the kinds the client
 * names and the reads it lists, and the few set operations the lists are held
 * to each other by.
 */
/// <reference types="vite/client" />
import { KINDS, READS } from "@lemonfiber/sdk-ts";

/** A feature of the spec, which is what a request still waiting belongs to. */
export type Feature =
  | "A2"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "B2"
  | "B4"
  | "B5"
  | "B8"
  | "B9"
  | "B10"
  | "C1"
  | "C3"
  | "C4"
  | "C5"
  | "C7"
  | "C9"
  | "C10"
  | "D1"
  | "D2"
  | "D3"
  | "D4"
  | "D5"
  | "D6"
  | "D7"
  | "D8"
  | "D9"
  | "D10"
  | "D11"
  | "E1"
  | "E2"
  | "E3"
  | "E4"
  | "F1"
  | "F2"
  | "F4"
  | "F8"
  | "F14"
  | "G2"
  | "G5"
  | "G6"
  | "G8"
  | "H5"
  | "K2"
  | "N1"
  | "N27"
  | "ARCH-R78"
  | "ARCH-R132"
  | "ARCH-R153"
  | "ARCH-R156"
  | "ARCH-R281"
  | "ARCH-R282"
  | "ARCH-R354"
  | "ARCH-R404"
  | "ARCH-R405"
  | "ARCH-R420"
  | "ARCH-R438"
  | "ARCH-R441"
  | "ARCH-R448";

/**
 * Every file under `src`, as written, by its path from the repository's root.
 *
 * Read through the bundler rather than off the disk, so the suite reads the tree
 * the build reads.
 */
const SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("./**/*.{ts,svelte}", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ).map(([path, source]) => [path.replace(/^\.\//, "src/"), source]),
);

/** One file under `src`, as written, or nothing where there is none. */
export function read(path: string): string {
  return SOURCES[path] ?? "";
}

/** Every kind the client names, as the list it exports rather than restated here. */
export function everyKind(): readonly string[] {
  return KINDS;
}

/** Where an import names a file of this repository. */
const IMPORTED = /from\s+"(\.{1,2}\/[^"]+)"/g;

/** The path one file names another by, joined to the directory it is in. */
function joined(from: string, named: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of named.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

/** The file an import names, where it is one this repository writes. */
function resolved(from: string, named: string): string | undefined {
  const at = joined(from, named);
  if (!at.startsWith("src/") || at.startsWith("src/paraglide/")) {
    return undefined;
  }
  if (at.endsWith(".svelte")) {
    return SOURCES[at] === undefined ? `${at}.ts` : at;
  }
  if (at.endsWith(".ts")) return at;
  return `${at.replace(/\.js$/, "")}.ts`;
}

/** Every file of this repository's reached by importing, starting at one. */
export function reachedFrom(start: string): ReadonlySet<string> {
  const reached = new Set<string>();
  const waiting = [start];
  for (let at = waiting.pop(); at !== undefined; at = waiting.pop()) {
    if (reached.has(at)) continue;
    reached.add(at);
    for (const [, named] of read(at).matchAll(IMPORTED)) {
      const next = named === undefined ? undefined : resolved(at, named);
      if (next !== undefined) waiting.push(next);
    }
  }
  return reached;
}

/** The places a kind is read: asked for, recognised, or listened for. */
const READERS = [
  /\basked\(\s*[^,]+,\s*[^,]+,\s*"([a-z-]+)"/g,
  /\bheard\(\s*[^,]+,\s*[^,]+,\s*"([a-z-]+)"/g,
  /\bisKind\(\s*[^,]+,\s*"([a-z-]+)"\)/g,
  /\bnarrowed\(\s*[^,]+,\s*"([a-z-]+)"\)/g,
  /"([a-z-]+)" satisfies Kind\b/g,
];

/** Every kind something the page imports reads. */
export function everyKindRead(): readonly string[] {
  const found = new Set<string>();
  for (const file of reachedFrom("src/main.ts")) {
    const source = read(file);
    for (const reader of READERS) {
      for (const [, kind] of source.matchAll(reader)) {
        if (kind !== undefined) found.add(kind);
      }
    }
  }
  return [...found];
}

/** Every kind a read the contract lists answers with. */
export function everyKindServed(): readonly string[] {
  return Object.values(READS).flatMap((read) => read.kinds);
}

/** Every entry in several lists, named. */
export function named(
  ...lists: readonly (readonly string[])[]
): readonly string[] {
  return lists.flat();
}

/** What is in `these` and not in `those`. */
export function without(
  these: readonly string[],
  those: readonly string[],
): readonly string[] {
  return these.filter((one) => !those.includes(one));
}

/** What is in `these` and in `those`. */
export function among(
  these: readonly string[],
  those: readonly string[],
): readonly string[] {
  return these.filter((one) => those.includes(one));
}

/** What appears more than once. */
export function twice(all: readonly string[]): readonly string[] {
  return all.filter((one, at) => all.indexOf(one) !== at);
}
