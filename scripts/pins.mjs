#!/usr/bin/env node
/**
 * Every revision this surface pins in another lemonfiber repository, held
 * against two things: what that repository's default branch is now, and what
 * the lockfile says was resolved for it.
 *
 * The pins are found rather than listed. Any dependency whose specifier points
 * at a lemonfiber repository on GitHub is one, so a pin added later is watched
 * from the pull request that adds it.
 *
 * Each verdict is printed and, on a CI run, written to the step summary as well,
 * so the run page says which one was reached without this file being read. A
 * failure also names the package and the command that brings it current, in the
 * annotation GitHub shows on the check itself.
 *
 * Exits 1 when any pin failed either comparison, or when there was nothing to
 * compare: a run that found no pins has not shown that none are behind.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, matchesGlob } from "node:path";

/**
 * Asked for by absolute path rather than found on `PATH`. It is where git lives
 * on the CI runner and on macOS; `GIT` names another.
 */
const GIT = process.env["GIT"] ?? "/usr/bin/git";

const ORG = "lemonfiber";

/** The manifest fields npm installs from. Peers are the consumer's to provide. */
const FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];

/**
 * A lemonfiber repository on GitHub, in any of the spellings npm accepts for
 * one, with whatever follows `#` captured as the revision.
 */
const PINNED = new RegExp(
  String.raw`^(?:github:|git\+ssh://git@github\.com[:/]|git\+https://github\.com/|git://github\.com/)?` +
    String.raw`${ORG}/([\w.-]+?)(?:\.git)?(?:#(.*))?$`,
);

const EXACT = /^[0-9a-f]{40}$/;

/** How many changed paths a verdict lists before it counts the rest. */
const LISTED = 20;

/**
 * What a package has to be told beyond `npm install`, where there is more.
 *
 * The client builds at install, and `gate.yml` installs with `--ignore-scripts`,
 * so its build is run by name. A type error after that is the client changing a
 * shape this surface draws, which is a change here rather than a bump.
 */
const AFTER = {
  "@lemonfiber/sdk-ts": {
    command: "npm run client",
    advice: [
      "Then run `npm run client` to rebuild against it. If `npm run types` goes",
      "red on that, the client has changed a shape this surface draws, and taking",
      "it is a change here rather than a bump — say so in the pull request instead",
      "of forcing it green.",
    ],
  },
};

/**
 * Scripts that make npm build a git dependency from its own tree when it
 * installs it — the list pacote's git fetcher checks before it prepares one.
 */
const BUILDS = [
  "preinstall",
  "install",
  "postinstall",
  "prepack",
  "prepare",
  "build",
];

/**
 * What npm packs whatever `files` says: the manifest, and a readme, copying
 * notice or licence at the root under any extension.
 */
const ALWAYS = /^(?:package\.json|(?:readme|copying|licen[cs]e)(?:\..*)?)$/i;

const summary = process.env["GITHUB_STEP_SUMMARY"];

function say(...lines) {
  for (const line of lines) {
    console.log(line);
    if (summary !== undefined) appendFileSync(summary, `${line}\n`);
  }
}

function annotate(message) {
  console.log(`::error::${message}`);
}

function git(...args) {
  return execFileSync(GIT, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readJson(name) {
  return JSON.parse(
    readFileSync(new URL(`../${name}`, import.meta.url), "utf8"),
  );
}

/** Every dependency that points at a lemonfiber repository, as declared. */
function pinsIn(manifest) {
  const pins = [];
  for (const field of FIELDS) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
      const match = PINNED.exec(spec);
      if (match === null) continue;
      pins.push({
        name,
        field,
        spec,
        repo: match[1],
        revision: match[2] ?? "",
      });
    }
  }
  return pins;
}

/** The revision a lockfile's `resolved` for a git dependency ends in. */
function revisionOf(resolved) {
  return typeof resolved === "string" ? resolved.split("#")[1] : undefined;
}

/**
 * Whether the lockfile records the pin the manifest declares, in both places it
 * keeps one: its copy of the declaration, and what was resolved for it.
 */
function lockDisagreement(pin, lock) {
  const declared = lock.packages?.[""]?.[pin.field]?.[pin.name];
  const resolved = revisionOf(
    lock.packages?.[`node_modules/${pin.name}`]?.resolved,
  );
  const faults = [];
  if (declared !== pin.spec) {
    faults.push(
      `- the lockfile's copy of the declaration: \`${declared ?? "(none)"}\``,
    );
  }
  if (resolved !== pin.revision) {
    faults.push(
      `- the revision the lockfile resolved: \`${resolved ?? "(none)"}\``,
    );
  }
  return faults;
}

/**
 * Whether a path in the dependency's tree can change what lands in
 * `node_modules`, read from the dependency's own manifest at `head`.
 *
 * A package npm builds at install is built from its whole tree, so everything
 * counts but its workflows under `.github/`, which are its own CI, and its
 * `*.test.ts` files, which are its tests. A package installed as it stands ships
 * what its `files` lists plus what npm always packs, and nothing else can reach
 * this surface. A manifest that cannot be read, or has no `files`, counts every
 * path.
 */
function shippedBy(clone, head) {
  let manifest;
  try {
    manifest = JSON.parse(
      git("--git-dir", clone, "show", `${head}:package.json`),
    );
  } catch {
    return () => true;
  }

  const scripts = manifest.scripts ?? {};
  if (
    manifest.workspaces !== undefined ||
    BUILDS.some((name) => name in scripts)
  ) {
    return (path) => !path.startsWith(".github/") && !path.endsWith(".test.ts");
  }

  if (!Array.isArray(manifest.files)) return () => true;

  const bare = (path) =>
    path
      .replace(/^!/, "")
      .replace(/^\.?\//, "")
      .replace(/\/$/, "");
  const entry = (pattern) => (path) =>
    path === pattern ||
    path.startsWith(`${pattern}/`) ||
    matchesGlob(path, pattern);
  const bins =
    typeof manifest.bin === "string"
      ? [manifest.bin]
      : Object.values(manifest.bin ?? {});
  const named = [manifest.main, ...bins]
    .filter((path) => typeof path === "string")
    .map(bare);
  const patterns = manifest.files.filter((f) => typeof f === "string");
  const included = patterns
    .filter((f) => !f.startsWith("!"))
    .map(bare)
    .map(entry);
  const excluded = patterns
    .filter((f) => f.startsWith("!"))
    .map(bare)
    .map(entry);

  return (path) =>
    ALWAYS.test(path) ||
    named.includes(path) ||
    (included.some((matches) => matches(path)) &&
      !excluded.some((matches) => matches(path)));
}

function remedy(pin, head) {
  const after = AFTER[pin.name];
  return {
    advice: after?.advice ?? [],
    command:
      after === undefined
        ? "npm install"
        : `npm install, then ${after.command}`,
    target: `github:${ORG}/${pin.repo}#${head}`,
  };
}

/** Compares one pin with its repository's default branch. True when it holds. */
function compare(pin) {
  const clone = mkdtempSync(join(tmpdir(), `lemonfiber-${pin.repo}-`));
  try {
    // Bare and blob-less: the history, and only the one file read from it.
    git(
      "clone",
      "--bare",
      "--filter=blob:none",
      "--quiet",
      `https://github.com/${ORG}/${pin.repo}.git`,
      clone,
    );
    return compareIn(clone, pin);
  } catch (error) {
    const said = String(error.stderr ?? "").trim();
    say(
      `## \`${pin.name}\` could not be compared`,
      "",
      `Reading ${ORG}/${pin.repo} failed, so whether the pin is behind is unknown`,
      "rather than known to be current.",
      "",
      "```",
      said === "" ? String(error.message) : said,
      "```",
    );
    annotate(
      `${pin.name}: ${ORG}/${pin.repo} could not be read, so the pin was not compared — rerun this check`,
    );
    return false;
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

function compareIn(clone, pin) {
  const branch = git("--git-dir", clone, "symbolic-ref", "--short", "HEAD");
  const head = git("--git-dir", clone, "rev-parse", "HEAD");
  const where = `${pin.repo} ${branch}`;
  const fix = remedy(pin, head);
  const facts = [
    `- pinned in \`package.json\`: \`${pin.revision}\``,
    `- ${where}: \`${head}\``,
  ];

  let known = true;
  try {
    git("--git-dir", clone, "cat-file", "-e", `${pin.revision}^{commit}`);
  } catch {
    known = false;
  }

  if (!known) {
    say(
      `## The pinned \`${pin.name}\` is not a commit in ${pin.repo}`,
      "",
      `The manifest names a revision ${ORG}/${pin.repo} has no commit for, so what this`,
      "surface is built from is not something anyone else can fetch.",
      "",
      ...facts,
      "",
      `To fix it: point the dependency at \`${fix.target}\` in \`package.json\` and`,
      `run \`${fix.command}\`, so the lockfile moves with it.`,
    );
    annotate(
      `${pin.name}: the pinned revision is not a commit in ${ORG}/${pin.repo} — point it at ${fix.target} in package.json and run ${fix.command}`,
    );
    return false;
  }

  if (pin.revision === head) {
    say(
      `## \`${pin.name}\` is current`,
      "",
      `It is pinned at \`${head}\`, which is what ${where} is.`,
    );
    return true;
  }

  const behind = git(
    "--git-dir",
    clone,
    "log",
    "--oneline",
    `${pin.revision}..${head}`,
  );

  // Ahead of the branch, or on a history it no longer carries. Either way the
  // pin is not a point on the line this compares against, and calling it
  // current would be a different wrong answer.
  if (behind === "") {
    say(
      `## The pinned \`${pin.name}\` is not on ${where}`,
      "",
      `The pin is a commit ${pin.repo} holds, but not one ${branch} reaches: it sits ahead`,
      `of ${branch} or on a history ${branch} no longer carries. There is no list of`,
      "commits to take, because the pin is not a point on the line this compares against.",
      "",
      ...facts,
      "",
      `To fix it: point the dependency at \`${fix.target}\` in \`package.json\` and`,
      `run \`${fix.command}\`, so the lockfile moves with it.`,
    );
    annotate(
      `${pin.name}: the pinned revision is not on ${where} — point it at ${fix.target} in package.json and run ${fix.command}`,
    );
    return false;
  }

  const ships = shippedBy(clone, head);
  const changed = git(
    "--git-dir",
    clone,
    "diff",
    "--name-only",
    pin.revision,
    head,
  )
    .split("\n")
    .filter((path) => path !== "" && ships(path));

  if (changed.length === 0) {
    say(
      `## \`${pin.name}\` is current`,
      "",
      `It is pinned at \`${pin.revision}\`. ${where} is at \`${head}\`, and no file`,
      "changed since is one npm installs this package from.",
    );
    return true;
  }

  say(
    `## \`${pin.name}\` is behind ${where}`,
    "",
    ...facts,
    "",
    "This surface has not taken these:",
    "",
    "```",
    behind,
    "```",
    "",
    "Of what npm installs from it, these changed:",
    "",
    ...changed.slice(0, LISTED).map((path) => `- \`${path}\``),
    ...(changed.length > LISTED
      ? [`- and ${changed.length - LISTED} more`]
      : []),
    "",
    `To catch up: point the dependency at \`${fix.target}\` in \`package.json\`,`,
    "then run `npm install` so the lockfile moves with it.",
    ...fix.advice,
  );
  annotate(
    `${pin.name} is behind ${where} — point it at ${fix.target} in package.json and run ${fix.command}`,
  );
  return false;
}

/** Checks one pin against the lockfile and its repository. True when both hold. */
function check(pin, lock) {
  if (!EXACT.test(pin.revision)) {
    say(
      `## The pinned \`${pin.name}\` could not be read`,
      "",
      "This did not get as far as comparing anything: the manifest does not name an",
      "exact revision, so what this surface is built from is unknown rather than behind.",
      `The entry takes \`github:${ORG}/${pin.repo}#\` followed by a full 40-character commit hash.`,
      "",
      `- \`${pin.name}\`: \`${pin.spec}\``,
    );
    annotate(
      `${pin.name} is not pinned to an exact revision — set it to github:${ORG}/${pin.repo}#<40-character commit hash> in package.json and run npm install`,
    );
    return false;
  }

  const faults = lockDisagreement(pin, lock);
  if (faults.length > 0) {
    // `npm ci` does not catch this for a git dependency: it installs the
    // manifest's revision, leaves the lockfile naming another, and exits 0.
    say(
      `## The lockfile disagrees with the manifest on \`${pin.name}\``,
      "",
      `- \`package.json\`: \`${pin.spec}\``,
      ...faults,
      "",
      "`npm ci` installs the manifest's revision and says nothing, so the lockfile is",
      "a record of a build that did not happen. Run `npm install` so it names the",
      "revision the manifest does, and commit both.",
      "",
    );
    annotate(
      `${pin.name}: package-lock.json does not name the revision package.json pins — run npm install and commit package-lock.json`,
    );
  }

  return compare(pin) && faults.length === 0;
}

function main() {
  let pins;
  let lock;
  try {
    pins = pinsIn(readJson("package.json"));
    lock = readJson("package-lock.json");
  } catch (error) {
    say(
      "## The pins could not be read",
      "",
      "```",
      String(error.message),
      "```",
    );
    annotate(
      "package.json or package-lock.json could not be read, so no pin was compared",
    );
    return false;
  }

  if (pins.length === 0) {
    say(
      "## No pins were found",
      "",
      `No dependency in \`package.json\` points at a ${ORG} repository, so nothing was`,
      "compared. If that is so on purpose, this check and its workflow go with it.",
    );
    annotate(
      `no dependency in package.json points at a ${ORG} repository, so nothing was compared`,
    );
    return false;
  }

  let held = true;
  for (const pin of pins) {
    if (!check(pin, lock)) held = false;
    say("");
  }
  return held;
}

if (!main()) process.exit(1);
