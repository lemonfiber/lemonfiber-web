#!/usr/bin/env node
/** Structural guards. Collects every violation, then exits non-zero. */
import { readdir, readFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { compile, parse } from "svelte/compiler";

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
  failures.push(
    `${relative(ROOT, file)}${line === null ? "" : `:${line}`}  ${msg}`,
  );

/** Markers that open an argument rather than state a fact. */
const REASONING =
  /^\s*(?:\/\/|\*|#|<!--)\s*(?:because|we |i |the reason|this is why|originally|it turns out|note that|arguably)/i;

const GENERATED = ["/generated/", "/paraglide/"];
const files = (await walk(SRC)).filter(
  (f) => !GENERATED.some((d) => f.includes(d)),
);

for (const file of files) {
  const ext = extname(file);
  const text = await readFile(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const at = i + 1;

    // The surface reaches lemonfiber and nothing else.
    if (
      /https?:\/\/(?!127\.0\.0\.1|localhost)/.test(line) &&
      !/^\s*(?:\/\/|\*|<!--)/.test(line)
    ) {
      fail(file, at, "external origin");
    }

    if (/eslint-disable/.test(line)) fail(file, at, "eslint-disable");
    if (/@ts-(?:ignore|expect-error|nocheck)/.test(line))
      fail(file, at, "TypeScript escape hatch");

    // Comments state facts. Reasoning belongs in an ADR.
    if (REASONING.test(line))
      fail(
        file,
        at,
        "reasoning in a comment — state the fact, argue in the ADR",
      );
  });

  if (!file.endsWith(".test.ts") && lines.length > LINE_CAP) {
    fail(file, null, `${lines.length} lines, cap is ${LINE_CAP}`);
  }

  // Every word a person reads comes from `messages/`. A string sitting in a
  // template is one no translator will ever see, and moving it later means
  // finding it first. Read from the parsed template: a regex over the source
  // cannot tell an attribute name from a sentence.
  if (ext === ".svelte" && !file.endsWith(".stories.svelte")) {
    let tree;
    try {
      tree = parse(text, { modern: true });
    } catch {
      tree = undefined;
    }

    const prose = [];
    const visit = (node) => {
      if (node === null || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) visit(child);
        return;
      }
      if (node.type === "Comment") return;
      if (node.type === "Text" && typeof node.data === "string") {
        const words = node.data
          .trim()
          .split(/\s+/)
          .filter((w) => /[A-Za-z]{2,}/.test(w));
        if (words.length >= 2) prose.push(words.join(" "));
      }
      for (const key of ["fragment", "nodes", "children", "body"]) {
        if (key in node) visit(node[key]);
      }
    };
    if (tree !== undefined) visit(tree.fragment);

    for (const found of prose) {
      fail(
        file,
        null,
        `prose in the template ("${found.slice(0, 44)}…") — move it to messages/`,
      );
    }
  }

  // Svelte inserts `?? ''` fallbacks the type system already makes unreachable,
  // which no test can cover and the 100% gate will not forgive. Two authoring
  // shapes produce them: interpolation inside an attribute string, and an
  // interpolation sharing a parent with a sibling. Both are invisible in the
  // source and obvious in the output, so the output is what is read.
  if (ext === ".svelte" && !file.endsWith(".stories.svelte")) {
    let js;
    try {
      js = compile(text, { generate: "client", dev: false }).js.code;
    } catch (problem) {
      fail(file, null, `does not compile: ${String(problem)}`);
      continue;
    }

    for (const call of js.matchAll(
      /\$\.(set_text|set_attribute|set_class)\([^;]*?\?\? ''/g,
    )) {
      const upto = js.slice(0, call.index);
      fail(
        file,
        null,
        `compiles to an unreachable \`?? ''\` in ${call[1]} — give the interpolation its own element, ` +
          `or bind the whole attribute (line ~${String(upto.split("\n").length)} of the output)`,
      );
    }
  }
}

// Brand states its dark palette only under `[data-lf-theme="ink"]`, and the
// surface also has to answer `prefers-color-scheme`, which brand does not
// cover. That leaves one set of values written in two places, so the two are
// compared here rather than left to drift apart unnoticed.
const BRAND_TOKENS = join(
  ROOT,
  "node_modules/@lemonfiber/brand/tokens/tokens.css",
);

/** The custom properties a `{ … }` block declares, keyed by name. */
function declarations(css, opener) {
  const at = css.indexOf(opener);
  if (at === -1) return undefined;
  const body = css.slice(at + opener.length, css.indexOf("}", at));
  const found = new Map();
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    found.set(name, value.trim().toLowerCase());
  }
  return found;
}

const brandInk = declarations(
  await readFile(BRAND_TOKENS, "utf8"),
  '[data-lf-theme="ink"] {',
);
const surfaceDark = declarations(
  await readFile(join(SRC, "app.css"), "utf8"),
  ':root:not([data-lf-theme="paper"]) {',
);

if (brandInk === undefined || surfaceDark === undefined) {
  fail(
    join(SRC, "app.css"),
    null,
    "cannot find both dark palettes to compare — brand's ink block or the surface's system-preference block has moved",
  );
} else {
  for (const [name, value] of brandInk) {
    const mine = surfaceDark.get(name);
    if (mine === undefined) {
      fail(
        join(SRC, "app.css"),
        null,
        `the system-preference block does not set ${name}, which brand's ink theme does — dark mode would fall back to the light value`,
      );
    } else if (mine !== value) {
      fail(
        join(SRC, "app.css"),
        null,
        `${name} is ${mine} for the system preference and ${value} in brand's ink theme — the two dark paths disagree`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`guards: ${failures.length} violation(s)\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`guards: clean (${files.length} files)`);
