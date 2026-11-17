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
 * the manifest pins, runs that package's own build and packs the result, which is
 * unpacked in its place: it depends on nothing, so nothing else in the tree is
 * resolved again, and the formatter, the linter and the types the lockfile pins
 * are the ones every gate runs.
 *
 * Nothing calls this after an ordinary `npm install`, which has already built it.
 */
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The archiver, by the one path it has on every machine this runs on. */
const TAR = "/usr/bin/tar";

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

/**
 * The npm running this script, asked for by absolute path rather than found on
 * `PATH` — and it is the same npm, rather than whichever one a search turns up.
 */
const cli = process.env["npm_execpath"];

if (cli === undefined) {
  console.error(
    "client: run this as `npm run client`, so it has an npm to use",
  );
  process.exit(1);
}

const npm = (...args) => {
  execFileSync(process.execPath, [cli, ...args], { stdio: "inherit" });
};

const into = mkdtempSync(join(tmpdir(), "lemonfiber-client-"));
npm("pack", spec, "--pack-destination", into);

const packed = readdirSync(into).filter((file) => file.endsWith(".tgz"));

if (packed.length !== 1) {
  console.error(`client: packing ${spec} produced ${packed.length} archives`);
  process.exit(1);
}

const target = new URL(`../node_modules/${NAME}/`, import.meta.url);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
execFileSync(TAR, [
  "-xzf",
  join(into, packed[0]),
  "-C",
  fileURLToPath(target),
  "--strip-components=1",
]);
const built = JSON.parse(readFileSync(new URL("package.json", target), "utf8"));
if (Object.keys(built.dependencies ?? {}).length > 0) {
  console.error(
    `client: ${NAME} now depends on other packages, so unpacking it alone would leave them out`,
  );
  process.exit(1);
}
rmSync(into, { recursive: true, force: true });

console.log(`client: built ${NAME} from ${spec}`);
