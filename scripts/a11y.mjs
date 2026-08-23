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
 * The three ways a reader can arrive at a palette. `ink` is the explicit
 * choice, which brand answers with its own attribute block. `system` sets an
 * attribute brand does not match, so `prefers-color-scheme` answers instead —
 * the path a reader who has never touched the toggle actually gets, and the
 * one no story would otherwise render.
 */
const THEMES = [
  { name: "paper", scheme: "light" },
  { name: "ink", scheme: "light" },
  { name: "system", scheme: "dark" },
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
          `${theme.name.padEnd(6)} ${violation.id.padEnd(18)} ${id}\n        ${node.target.join(" ")}\n        ${node.failureSummary?.split("\n").join(" ") ?? ""}`,
        );
      }
    }
  }
  await context.close();
}

await browser.close();
server.close();

const checked = `${String(stories.length)} stories × ${THEMES.map((t) => t.name).join(", ")}`;
if (found.length > 0) {
  console.error(
    `a11y: ${String(found.length)} violation(s) across ${checked}\n`,
  );
  for (const one of found) console.error(`  ${one}`);
  process.exit(1);
}
console.log(`a11y: clean (${checked})`);
