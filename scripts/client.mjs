#!/usr/bin/env node
/**
 * Builds the first-party client and puts it where the tree expects it.
 *
 * The client ships its build rather than its sources, so it builds when it is
 * installed. A hardened install passes `--ignore-scripts`, which is what stops
 * every package in the tree running code at install time — and stops this one
 * building.
 *
 * So the one build that is needed is run by name. `npm pack` clones the commit
 * the manifest pins, runs that package's own build and packs the result; the
 * install that follows runs no scripts, writes no lockfile, and leaves the rest
 * of the tree alone.
 *
 * Nothing calls this after an ordinary `npm install`, which has already built it.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The dependency that arrives as a commit rather than as a published build. */
const NAME = "@lemonfiber/sdk-ts";

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const spec = manifest.dependencies[NAME];

if (spec === undefined) {
  console.error(`client: ${NAME} is not a dependency of this package`);
  process.exit(1);
}

const npm = (...args) => {
  execFileSync("npm", args, { stdio: "inherit" });
};

const into = mkdtempSync(join(tmpdir(), "lemonfiber-client-"));
npm("pack", spec, "--pack-destination", into);

const packed = readdirSync(into).filter((file) => file.endsWith(".tgz"));

if (packed.length !== 1) {
  console.error(`client: packing ${spec} produced ${packed.length} archives`);
  process.exit(1);
}

rmSync(new URL(`../node_modules/${NAME}`, import.meta.url), {
  recursive: true,
  force: true,
});
npm(
  "install",
  "--no-save",
  "--no-package-lock",
  "--ignore-scripts",
  join(into, packed[0]),
);
rmSync(into, { recursive: true, force: true });

console.log(`client: built ${NAME} from ${spec}`);
