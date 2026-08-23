#!/usr/bin/env node
/**
 * Runs axe over every built story, in both themes, and fails on any violation.
 *
 * Storybook's a11y addon is configured to treat a violation as an error, but
 * building Storybook never renders a story, so nothing was checking. This is
 * what checks.
 */
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const ROOT = new URL("..", import.meta.url).pathname;
const BUILT = join(ROOT, "storybook-static");
/**
 * The ways a reader can arrive at the interface. `ink` is the explicit
 * choice, which brand answers with its own attribute block. `system` sets an
 * attribute brand does not match, so `prefers-color-scheme` answers instead —
 * the path a reader who has never touched the toggle actually gets, and the
 * one no story would otherwise render. The last two are the system
 * preferences the palette itself has to answer: a reader asking for more
 * contrast, and one whose system replaces every colour outright.
 */
const THEMES = [
  { name: "paper", scheme: "light" },
  { name: "ink", scheme: "light" },
  { name: "system", scheme: "dark" },
  { name: "paper", scheme: "light", contrast: "more", as: "contrast" },
  { name: "ink", scheme: "dark", forcedColors: "active", as: "forced" },
];

/** The tags that spell out WCAG 2.2 AA, which is the level the surface owes. */
const AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const TYPES = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".css", "text/css"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

/** Serves the built Storybook, so the sweep needs nothing installed to run. */
function serve() {
  const server = createServer((request, response) => {
    const asked = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const path = join(BUILT, normalize(asked).replace(/^(\.\.[/\\])+/, ""));
    stat(path)
      .then((found) => {
        if (found.isDirectory()) throw new Error("directory");
        response.writeHead(200, {
          "content-type":
            TYPES.get(extname(path)) ?? "application/octet-stream",
        });
        createReadStream(path).pipe(response);
      })
      .catch(() => {
        response.writeHead(404);
        response.end();
      });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

const index = JSON.parse(await readFile(join(BUILT, "index.json"), "utf8"));
const stories = Object.values(index.entries)
  .filter((entry) => entry.type === "story")
  .map((entry) => entry.id);

if (stories.length === 0) {
  console.error("a11y: no stories in storybook-static — run storybook:build");
  process.exit(1);
}

const { server, port } = await serve();
const browser = await chromium.launch();

const found = [];
for (const theme of THEMES) {
  // axe rejects the implicit context `browser.newPage()` opens.
  const context = await browser.newContext({
    viewport: { width: 1200, height: 700 },
    colorScheme: theme.scheme,
    ...(theme.contrast === undefined ? {} : { contrast: theme.contrast }),
    ...(theme.forcedColors === undefined
      ? {}
      : { forcedColors: theme.forcedColors }),
  });
  const page = await context.newPage();
  for (const id of stories) {
    await page.goto(
      `http://127.0.0.1:${String(port)}/iframe.html?id=${id}&globals=theme:${theme.name}&viewMode=story`,
      { waitUntil: "networkidle" },
    );
    const { violations } = await new AxeBuilder({ page })
      .withTags(AA)
      .analyze();
    for (const violation of violations) {
      for (const node of violation.nodes) {
        found.push(
          `${(theme.as ?? theme.name).padEnd(8)} ${violation.id.padEnd(18)} ${id}\n        ${node.target.join(" ")}\n        ${node.failureSummary?.split("\n").join(" ") ?? ""}`,
        );
      }
    }
  }
  await context.close();
}

/**
 * Somewhere focus can enter and not leave is a keyboard trap. Tabbing once
 * more than there are places to land should reach every one of them; reaching
 * fewer means focus is circling inside something it cannot get out of.
 *
 * One pass, in one palette: a trap is structural, and a colour neither makes
 * nor unmakes one.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const keyboard = await browser.newContext({
  viewport: { width: 1200, height: 700 },
});
const tabbing = await keyboard.newPage();

for (const id of stories) {
  await tabbing.goto(
    `http://127.0.0.1:${String(port)}/iframe.html?id=${id}&globals=theme:paper&viewMode=story`,
    { waitUntil: "networkidle" },
  );

  // Number each place focus can land, once, so reading where it is costs a
  // property rather than a walk of the document.
  //
  // A roving tabindex takes a group of controls out of the tab order and
  // leaves one in — a radio group is meant to be entered once and moved
  // through by arrow. Counting the others as places to land would read
  // correct behaviour as a trap.
  const places = await tabbing.evaluate((selector) => {
    const landings = [...document.querySelectorAll(selector)].filter(
      (element) =>
        element instanceof HTMLElement &&
        element.offsetParent !== null &&
        element.getAttribute("tabindex") !== "-1",
    );
    landings.forEach((element, index) => {
      element.dataset["landing"] = String(index);
    });
    return landings.length;
  }, FOCUSABLE);

  // One place to land cannot trap anything: there is nowhere to circle.
  if (places < 2) continue;

  const reached = new Set();
  for (let press = 0; press < places + 1; press += 1) {
    await tabbing.keyboard.press("Tab");
    const at = await tabbing.evaluate(() => {
      const here = document.activeElement;
      return here instanceof HTMLElement ? (here.dataset["landing"] ?? "") : "";
    });
    if (at !== "") reached.add(at);
  }

  if (reached.size < places) {
    found.push(
      `keyboard ${"trap".padEnd(18)} ${id}\n        focus reached ${String(reached.size)} of ${String(places)} places to land`,
    );
  }
}

await keyboard.close();

await browser.close();
server.close();

const checked = `${String(stories.length)} stories × ${THEMES.map((t) => t.as ?? t.name).join(", ")}`;
if (found.length > 0) {
  console.error(
    `a11y: ${String(found.length)} violation(s) across ${checked}\n`,
  );
  for (const one of found) console.error(`  ${one}`);
  process.exit(1);
}
console.log(`a11y: clean (${checked})`);
