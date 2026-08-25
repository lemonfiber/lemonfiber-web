#!/usr/bin/env node
/**
 * Drives every built story in a browser and fails on anything it finds.
 *
 * Axe runs over each story once per rendering in `THEMES`. Three further passes
 * read one rendering each: somewhere focus cannot leave and a place it lands
 * without drawing a ring, movement a reduced-motion preference does not stop or
 * that repeats fast enough to flash, and a page that scrolls sideways at 320
 * pixels.
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

/**
 * One story's address, in one rendering.
 *
 * Storybook's accessibility addon runs axe in the page as a story renders, and
 * axe refuses a second run while one is in flight. This sweep is the second run,
 * and the two ask the same question of the same page. `a11y.manual` is what
 * turns the addon's own run off, so only one of them runs.
 */
function storyAt(port, id, theme = "paper") {
  return (
    `http://127.0.0.1:${String(port)}/iframe.html?id=${id}` +
    `&globals=theme:${theme};a11y.manual:!true&viewMode=story`
  );
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
    await page.goto(storyAt(port, id, theme.name), {
      waitUntil: "networkidle",
    });
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
 * The same walk reads what each landing draws. `:focus-visible` matches on
 * keyboard entry, so the ring a keyboard reader steers by is on the page after
 * a `Tab` and not after the scripted `focus()` a component test would use,
 * which Chromium does not reliably match.
 *
 * One pass, in one palette. A trap is structural, and a colour neither makes
 * nor unmakes one. Forced colours are left out of the ring: the user agent
 * draws its own there and overrides the stylesheet's.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/** The narrowest outline that counts as drawn, in device pixels. */
const RING = 2;

/** A colour the ground shows straight through: an alpha of nothing. */
const CLEAR = /^rgba\([^)]*,\s*0(?:\.0+)?\)$/;

/**
 * Whether focus drew something here that was not drawn before it.
 *
 * Either mark answers: an outline at least `RING` wide, in a colour that is
 * not transparent, or a shadow. A control that replaces the ring with a
 * shadow passes on the shadow.
 *
 * Both are read against what the same element drew unfocused. Three controls
 * in this interface carry `box-shadow: inset 0 0 0 1px` for as long as they
 * are the current place, so a shadow being present is not an indicator of
 * focus, and a shadow having appeared is. `outline-width` reads 3px through an
 * `outline-style: none`, so the style is what says whether a line is drawn at
 * all and the width only how wide the drawn one is.
 */
function draws(at) {
  const isOutlined =
    at.outlineStyle !== "none" &&
    Number.parseFloat(at.outlineWidth) >= RING &&
    !CLEAR.test(at.outlineColor) &&
    at.outline !== at.wasOutline;
  const isShadowed = at.shadow !== "none" && at.shadow !== at.wasShadow;
  return isOutlined || isShadowed;
}

/** Where focus is, what it draws there, and what the same element drew before. */
const LANDED = () => {
  const here = document.activeElement;
  if (!(here instanceof HTMLElement)) return null;
  const landing = here.dataset["landing"];
  if (landing === undefined) return null;
  const style = getComputedStyle(here);
  const first = here.classList[0];
  const word = (here.textContent ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
  return {
    landing,
    where:
      `${here.tagName.toLowerCase()}${first === undefined ? "" : `.${first}`}` +
      (word === "" ? "" : ` “${word}”`),
    outline: style.outline,
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    outlineColor: style.outlineColor,
    shadow: style.boxShadow,
    wasOutline: here.dataset["ring"] ?? "",
    wasShadow: here.dataset["shadow"] ?? "",
  };
};

const keyboard = await browser.newContext({
  viewport: { width: 1200, height: 700 },
});
const tabbing = await keyboard.newPage();

let landings = 0;

for (const id of stories) {
  await tabbing.goto(storyAt(port, id), { waitUntil: "networkidle" });

  // Number each place focus can land, once, so reading where it is costs a
  // property rather than a walk of the document. What each draws unfocused is
  // written down in the same pass, while nothing on the page has focus.
  //
  // A roving tabindex takes a group of controls out of the tab order and
  // leaves one in — a radio group is meant to be entered once and moved
  // through by arrow. Counting the others as places to land would read
  // correct behaviour as a trap.
  const places = await tabbing.evaluate((selector) => {
    const spots = [...document.querySelectorAll(selector)].filter(
      (element) =>
        element instanceof HTMLElement &&
        element.offsetParent !== null &&
        element.getAttribute("tabindex") !== "-1",
    );
    spots.forEach((element, index) => {
      const style = getComputedStyle(element);
      element.dataset["landing"] = String(index);
      element.dataset["ring"] = style.outline;
      element.dataset["shadow"] = style.boxShadow;
    });
    return spots.length;
  }, FOCUSABLE);

  // Nowhere to land is nothing to walk.
  if (places === 0) continue;

  const reached = new Set();
  for (let press = 0; press < places + 1; press += 1) {
    await tabbing.keyboard.press("Tab");
    const at = await tabbing.evaluate(LANDED);
    if (at === null || reached.has(at.landing)) continue;
    reached.add(at.landing);
    landings += 1;
    if (!draws(at)) {
      found.push(
        `focus    ${"no ring".padEnd(18)} ${id}\n        ${at.where} — outline ${at.outline}, box-shadow ${at.shadow}`,
      );
    }
  }

  // One place to land cannot trap anything: there is nowhere to circle.
  if (places > 1 && reached.size < places) {
    found.push(
      `keyboard ${"trap".padEnd(18)} ${id}\n        focus reached ${String(reached.size)} of ${String(places)} places to land`,
    );
  }
}

await keyboard.close();

/**
 * What moves, and how wide it gets.
 *
 * Three questions of one rendering, so they are asked of one: a story is opened
 * once, read as it stands, read again with the motion preference set, and
 * measured again at a narrow window. Numbering the tree and reading a property
 * off it is what keeps that cheap.
 *
 * One palette, because none of the three is a colour: what animates, what a
 * preference suppresses and what a layout does at 320 pixels are the same in
 * every theme.
 */

/**
 * Every declared movement in the story's own tree.
 *
 * Scoped to the rendered story: Storybook leaves its loading chrome in the page,
 * hidden, with a spinner still declared on it, and a sweep of the whole document
 * would report Storybook's own animation on all 125 stories.
 *
 * Pseudo-elements are read too. The one transition in this interface is on an
 * `::after` — the knob a switch moves — so a sweep that read only elements would
 * find nothing and report that as clean.
 */
const MOVING = () => {
  const parts = (list) => list.split(",").map((one) => one.trim());
  const root = document.querySelector("#storybook-root");
  const moving = [];
  for (const element of root === null ? [] : root.querySelectorAll("*")) {
    for (const pseudo of [undefined, "::before", "::after"]) {
      const style = getComputedStyle(element, pseudo);
      const first = element.classList[0];
      const named = first === undefined ? "" : `.${first}`;
      const where = `${element.tagName.toLowerCase()}${named}${pseudo ?? ""}`;
      const periods = parts(style.animationDuration);
      const counts = parts(style.animationIterationCount);
      parts(style.animationName).forEach((name, index) => {
        if (name === "none") return;
        moving.push({
          where,
          what: name,
          period: Number.parseFloat(periods[index % periods.length] ?? "0"),
          forever: (counts[index % counts.length] ?? "1") === "infinite",
        });
      });
      const settling = Math.max(
        0,
        ...parts(style.transitionDuration).map(
          (one) => Number.parseFloat(one) || 0,
        ),
      );
      if (settling > 0) {
        moving.push({
          where,
          what: `transition ${style.transitionProperty}`,
          period: settling,
          forever: false,
        });
      }
      if (style.textDecorationLine.includes("blink")) {
        moving.push({ where, what: "blink", period: 0, forever: true });
      }
    }
  }
  return moving;
};

/**
 * The period below which a repeating animation is a flash.
 *
 * Three flashes a second is where the guidance draws the line, so a cycle
 * shorter than a third of a second is one.
 *
 * What this catches is a shape: an animation declared to repeat for ever, faster
 * than that. What it does not catch is everything a flash can be made of that no
 * stylesheet declares — a script swapping classes on a timer, a video, an
 * animated image, or a colour change driven from data. It says nothing about
 * area or luminance either, so the general threshold, which exempts a small
 * enough flashing region, is neither applied nor needed: nothing here is allowed
 * to repeat that fast at any size.
 */
const FLASH = 1 / 3;

/**
 * The window the guidance measures reflow at: 320 pixels wide, which is a
 * 1280-pixel window at 400% zoom. Content has to reach it without asking the
 * reader to scroll in two directions at once.
 *
 * Wide content scrolling inside its own container is right and is not caught
 * here — this asks only whether the page itself goes sideways.
 */
const NARROW = 320;

const reading = await browser.newContext({
  viewport: { width: 1200, height: 700 },
});
const measuring = await reading.newPage();

for (const id of stories) {
  await measuring.goto(storyAt(port, id), { waitUntil: "networkidle" });

  for (const one of await measuring.evaluate(MOVING)) {
    if (!one.forever || one.period >= FLASH) continue;
    found.push(
      `flash    ${"repeats".padEnd(18)} ${id}\n        ${one.where} — ${one.what} every ${String(one.period)}s, for ever`,
    );
  }

  await measuring.emulateMedia({ reducedMotion: "reduce" });
  for (const one of await measuring.evaluate(MOVING)) {
    if (one.period === 0) continue;
    found.push(
      `motion   ${"still moves".padEnd(18)} ${id}\n        ${one.where} — ${one.what} over ${String(one.period)}s`,
    );
  }
  await measuring.emulateMedia({ reducedMotion: null });

  await measuring.setViewportSize({ width: NARROW, height: 700 });
  const sideways = await measuring.evaluate(() => ({
    wants: document.documentElement.scrollWidth,
    has: document.documentElement.clientWidth,
  }));
  if (sideways.wants > sideways.has) {
    found.push(
      `narrow   ${"scrolls sideways".padEnd(18)} ${id}\n        the page wants ${String(sideways.wants)}px in a ${String(sideways.has)}px window`,
    );
  }
  await measuring.setViewportSize({ width: 1200, height: 700 });
}

await reading.close();

await browser.close();
server.close();

const checked =
  `${String(stories.length)} stories × ${THEMES.map((t) => t.as ?? t.name).join(", ")}` +
  `, ${String(landings)} focus landings`;
if (found.length > 0) {
  console.error(
    `a11y: ${String(found.length)} violation(s) across ${checked}\n`,
  );
  for (const one of found) console.error(`  ${one}`);
  process.exit(1);
}
console.log(`a11y: clean (${checked})`);
