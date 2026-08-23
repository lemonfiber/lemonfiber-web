#!/usr/bin/env node
/**
 * Writes what the built app declares about itself, beside it.
 *
 * The binary embeds this output and refuses to build against an app speaking a
 * wire version it does not. That check needs the app to say which it speaks, and
 * the answer is not this repository's to invent: the SDK takes it from the
 * contract the server generates, so reading it from there keeps one source.
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { API_VERSION } from "@lemonfiber/sdk-ts";

const DECLARED = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "app.json",
);

await writeFile(
  DECLARED,
  `${JSON.stringify({ api_version: API_VERSION }, null, 2)}\n`,
);
console.log(`declared api_version ${String(API_VERSION)}`);
