#!/usr/bin/env node
/** Structural guards. Collects every violation, then exits non-zero. */
import { readdir, readFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { compile, parse } from "svelte/compiler";
import { refuses, refusal } from "./warned.mjs";

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
const fail = (file, line, msg) => {
  const where = line === null ? "" : `:${String(line)}`;
  failures.push(`${relative(ROOT, file)}${where}  ${msg}`);
};

/**
 * Requirement identifiers, ADR numbers and spec paths. Provenance belongs in a
 * commit trailer and a pull request body, where it can be revised; a comment
 * naming the artefact that caused a line rots the moment that artefact moves.
 */
const IDENTIFIER = /\b(?:[A-Z]{1,5}\d*-R\d+|ADR-\d{3,}|G\d+)\b/;
const SPEC_PATH = /\bSpec: *\d/;
const cites = (line) => IDENTIFIER.test(line) || SPEC_PATH.test(line);

/** Markers that open an argument rather than state a fact. */
const REASONING =
  /^\s*(?:\/\/|\*|#|<!--)\s*(?:because|we |i |the reason|this is why|originally|it turns out|note that|arguably)/i;

/**
 * A dotted quad. RFC 5737 reserves 192.0.2.0/24, 198.51.100.0/24 and
 * 203.0.113.0/24 for writing about, and 127.0.0.0/8 is this machine; any other
 * literal in a component, a story or a test is a host somebody answers for, and
 * a screenshot of it names them.
 */
const ADDRESS = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const RESERVED =
  /^(?:127\.|0\.0\.0\.0$|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/;

/** A line that is, or continues, a comment. */
const COMMENT = /^\s*(?:\/\/|\/\*|\*|#|<!--)/;

/** What stands between one term of a declaration's value and the next. */
const BETWEEN_TERMS = /[\s(),/]+/;

/** One whole term, read as a number and the unit written against it. */
const LENGTH = /^(-?[\d.]+)([a-z]+)$/i;

/** The units that state a measure the reader's own size cannot move. */
const ABSOLUTE = new Set(["px", "pt", "pc", "in", "cm", "mm", "q"]);

/** The edges a border names, the bare shorthand among them. */
const EDGES = [
  "",
  "-top",
  "-right",
  "-bottom",
  "-left",
  "-block",
  "-block-start",
  "-block-end",
  "-inline",
  "-inline-start",
  "-inline-end",
];

/**
 * The properties that draw a line rather than measure one: a rule between two
 * rows, the bezel on a faceplate, the ring around a chosen option. No radius
 * is among them — a radius is a measure like any other.
 */
const DRAWS_A_LINE = new Set([
  ...EDGES.flatMap((edge) => [`border${edge}`, `border${edge}-width`]),
  "outline",
  "outline-width",
  "outline-offset",
  "column-rule",
  "column-rule-width",
  "text-decoration-thickness",
]);

/**
 * The properties that paint rather than measure. A shadow's offset and blur
 * and a stroke's width lay nothing out and hold no words, so they are neither
 * spacing nor type nor radius and take no size from the reader.
 */
const PAINTS = new Set([
  "box-shadow",
  "text-shadow",
  "stroke-width",
  "stroke-dashoffset",
]);

/** The widest a drawn line may be, in device pixels. */
const HAIRLINE = 2;

/** Every absolute length a declaration states, the drawn lines left out. */
function measures(property, value) {
  const found = [];
  if (PAINTS.has(property)) return found;
  for (const term of value.split(BETWEEN_TERMS)) {
    const length = LENGTH.exec(term);
    if (length === null) continue;
    const [, size, written] = length;
    const unit = written.toLowerCase();
    if (!ABSOLUTE.has(unit)) continue;
    const drawn =
      unit === "px" &&
      DRAWS_A_LINE.has(property) &&
      Math.abs(Number(size)) <= HAIRLINE;
    if (!drawn) found.push(`${size}${unit}`);
  }
  return found;
}

const GENERATED = ["/generated/", "/paraglide/"];
const files = (await walk(SRC)).filter(
  (f) => !GENERATED.some((d) => f.includes(d)),
);

/**
 * A story, which is a workbench rather than a screen this product ships.
 *
 * Its sample copy is an argument handed to a component, not a sentence a person
 * reads here, and its lines are outside the coverage gate. Two rules stand down
 * for it on that account: the collection point for words, and the fallbacks
 * Svelte inserts that a covered file would have to reach.
 *
 * The compiler's word on the markup it draws is not among them. Storybook draws a
 * story, `.storybook/main.ts` takes one written in either language, and a control
 * only a pointer can reach is one there as much as anywhere.
 */
const isStory = (file) => file.endsWith(".stories.svelte");

/** Whether the compiler's word is read for a file, a story's markup included. */
const isDrawn = (file) => extname(file) === ".svelte";

/**
 * Markup the compiler's word must refuse, and markup it must let through.
 *
 * No file in this tree may carry the defect this refuses, so a sweep that found
 * nothing looks exactly like a rule that reads nothing. Each case is a name the
 * sweep has to reach a verdict under and the markup it reaches one on: a story,
 * which Storybook draws and this walk skipped until now; a directory of this
 * repository's whose name merely holds the word `node_modules`; a dependency's
 * own markup, which is not this repository's to change; and a control a keyboard
 * reaches, which no rule may refuse.
 */
const POINTER_ONLY = "<div onclick={() => undefined}></div>";
const REACHABLE = "<button onclick={() => undefined}>Go</button>";

const PROVEN = [
  {
    at: "src/components/Proven.stories.svelte",
    markup: POINTER_ONLY,
    refused: true,
  },
  {
    at: "node_modules_cache/src/Proven.svelte",
    markup: POINTER_ONLY,
    refused: true,
  },
  {
    at: "node_modules/whoever/Proven.svelte",
    markup: POINTER_ONLY,
    refused: false,
  },
  { at: "src/components/Proven.svelte", markup: REACHABLE, refused: false },
];

for (const { at, markup, refused } of PROVEN) {
  if (!isDrawn(at))
    failures.push(
      `${at}  the sweep reads no compiler's word here, and has to: every file drawing markup is read`,
    );

  const said = compile(markup, {
    generate: "client",
    dev: false,
    filename: at,
  }).warnings.filter((warning) => refuses(warning));

  const stopped = said.length > 0;
  if (stopped === refused) continue;
  failures.push(
    refused
      ? `${at}  lets this through, and must not: ${markup}`
      : `${at}  refuses this, and must not: ${markup} (${said.map(refusal).join(", ")})`,
  );
}

/** How many files drawing markup the compiler's word was read for. */
let read = 0;

for (const file of files) {
  const story = isStory(file);
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

    for (const [found] of line.matchAll(ADDRESS)) {
      if (!RESERVED.test(found))
        fail(
          file,
          at,
          `${found} is a real address — write about 198.51.100.0/24 instead`,
        );
    }

    if (/eslint-disable/.test(line)) fail(file, at, "eslint-disable");
    if (/@ts-(?:ignore|expect-error|nocheck)/.test(line))
      fail(file, at, "TypeScript escape hatch");

    if (COMMENT.test(line) && cites(line))
      fail(
        file,
        at,
        "a citation in a comment — cite it in the commit trailer and the pull request instead",
      );

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
  if (isDrawn(file) && !story) {
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

    // Colour, type, spacing and radius come from tokens, so an absolute length
    // in a style block is a measure stated twice — and one that stands still
    // while the type around it follows the reader's own size.
    //
    // Four lengths stay literal. A drawn line is a hairline at every type
    // size, so a border and an outline keep their pixels. A shadow and a
    // stroke paint rather than measure, so their offsets keep theirs. A
    // breakpoint has nowhere else to go: a custom property is not valid in a
    // media feature, and a query's prelude is never read here. And `0` carries
    // no unit at all.
    //
    // A drawing's own grid never reaches here. A viewBox and an `x` are user
    // coordinates in the markup rather than lengths in a style block.
    const lineAt = (offset) => text.slice(0, offset).split("\n").length;
    const measure = (node) => {
      if (node === null || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) measure(child);
        return;
      }
      if (node.type === "Declaration") {
        const property = node.property.toLowerCase();
        for (const found of measures(property, node.value)) {
          fail(
            file,
            lineAt(node.start),
            `\`${property}: ${node.value}\` sets an absolute ${found} — take it from a token, or state it in rem so it follows the reader's own size`,
          );
        }
      }
      for (const key of ["children", "block", "nodes"]) {
        if (key in node) measure(node[key]);
      }
    };
    if (tree !== undefined) measure(tree.css);
  }

  // What the Svelte compiler says about a component, and what it makes of it.
  if (isDrawn(file)) {
    read += 1;
    let made;
    try {
      made = compile(text, {
        generate: "client",
        dev: false,
        filename: relative(ROOT, file),
      });
    } catch (error) {
      fail(file, null, `does not compile: ${String(error)}`);
      continue;
    }

    // A control only a pointer can reach is something the compiler already
    // names. The build refuses it too, through `onwarn` in `svelte.config.js`,
    // but a build compiles only what something imports; this walks every
    // component, whether anything imports it yet or not.
    for (const warning of made.warnings) {
      if (refuses(warning))
        fail(file, warning.start?.line ?? null, refusal(warning));
    }

    // Svelte inserts `?? ''` fallbacks the type system already makes
    // unreachable, which no test can cover and the 100% gate will not forgive.
    // Two authoring shapes produce them: interpolation inside an attribute
    // string, and an interpolation sharing a parent with a sibling. Both are
    // invisible in the source and obvious in the output, so the output is what
    // is read.
    const js = made.js.code;
    const fallbacks = story
      ? []
      : js.matchAll(/\$\.(set_text|set_attribute|set_class)\([^;]*?\?\? ''/g);

    for (const call of fallbacks) {
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

// A file kind quietly left out of the compile is how a story came to be skipped:
// the sweep read one file fewer and reported the same clean line. What was
// walked and what was read are counted against each other rather than left to
// agree.
const draws = files.filter(isDrawn).length;
if (read !== draws) {
  failures.push(
    `the sweep  read the compiler's word for ${String(read)} of the ${String(draws)} files that draw markup`,
  );
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
  for (const declaration of body.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const name = declaration.slice(0, colon).trim();
    if (!name.startsWith("--")) continue;
    found.set(
      name,
      declaration
        .slice(colon + 1)
        .trim()
        .toLowerCase(),
    );
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
