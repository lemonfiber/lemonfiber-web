#!/usr/bin/env node
/** Structural guards. Collects every violation, then exits non-zero. */
import { readdir, readFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const LINE_CAP = 550;

/** Every file under `dir`, recursively. */
async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}

const failures = [];
const fail = (file, line, msg) =>
  failures.push(`${relative(ROOT, file)}${line === null ? "" : `:${line}`}  ${msg}`);

/** Markers that open an argument rather than state a fact. */
const REASONING = /^\s*(?:\/\/|\*|#)\s*(?:because|we |i |the reason|this is why|originally|it turns out|note that|arguably)/i;

const files = await walk(SRC);

for (const file of files) {
  const ext = extname(file);
  const text = await readFile(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const at = i + 1;

    // Svelte compiles attribute interpolation to branches no test can reach.
    if (ext === ".svelte" && /\s[\w:-]+="[^"]*\{[^}]*\}[^"]*"/.test(line)) {
      fail(file, at, "attribute interpolation — bind the whole attribute or use a class: directive");
    }

    // The surface reaches lemonfiber and nothing else.
    if (/https?:\/\/(?!127\.0\.0\.1|localhost)/.test(line) && !/^\s*(?:\/\/|\*|<!--)/.test(line)) {
      fail(file, at, "external origin");
    }

    if (/eslint-disable/.test(line)) fail(file, at, "eslint-disable");
    if (/@ts-(?:ignore|expect-error|nocheck)/.test(line)) fail(file, at, "TypeScript escape hatch");

    // Comments state facts. Reasoning belongs in an ADR.
    if (REASONING.test(line)) fail(file, at, "reasoning in a comment — state the fact, argue in the ADR");
  });

  if (!file.endsWith(".test.ts") && lines.length > LINE_CAP) {
    fail(file, null, `${lines.length} lines, cap is ${LINE_CAP}`);
  }
}

if (failures.length > 0) {
  console.error(`guards: ${failures.length} violation(s)\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`guards: clean (${files.length} files)`);
