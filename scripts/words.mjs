#!/usr/bin/env node
/**
 * The words this console ships, held to the rules the binary's words are held to.
 *
 * Each rule here has a twin in the binary's own sweep over its string literals.
 * That sweep reads only paths inside its own repository, and this surface is a
 * separate one, so rules written to hold across every surface reached one of them.
 *
 * The corpus is `messages/en.json` and nothing else, which is the whole of what a
 * person reads here. `scripts/guards.mjs` refuses prose anywhere else in the tree,
 * so the collection point it enforces is what makes this sweep complete rather
 * than a sample of the words.
 *
 * A drawn screen is deliberately not the corpus. It carries another service's
 * name, a release title and whatever a daemon said back, and a sweep reading it
 * would be scanning words this product did not write.
 */
import { readFileSync } from "node:fs";

const CORPUS = new URL("../messages/en.json", import.meta.url);

/** The key inlang uses for the file's own schema, which nobody reads. */
const SCHEMA = "$schema";

const failures = [];
const fail = (where, message) => {
  failures.push(`${where}  ${message}`);
};

// ── What a message says, with the parts nobody reads taken out ───────────

/**
 * The text with every `{…}` removed, a placeholder being data inside a sentence.
 *
 * What arrives in one is a release title, a service name, a path or a figure —
 * words this product did not write and cannot be answerable for.
 */
function withoutPlaceholders(said) {
  let prose = "";
  let depth = 0;
  for (const character of said) {
    if (character === "{") depth += 1;
    else if (character === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0) prose += character;
  }
  return prose;
}

/** Whether this character is part of a word rather than the punctuation around it. */
function spells(character) {
  return /[\p{L}\p{N}']/u.test(character);
}

/**
 * One word with the punctuation around it taken off.
 *
 * Walked from each end rather than matched, a pattern anchored at both ends of a
 * run being one an adversarial string can make slow.
 */
function bare(word) {
  const letters = [...word];
  let from = 0;
  let to = letters.length;
  while (from < to && !spells(letters[from])) from += 1;
  while (to > from && !spells(letters[to - 1])) to -= 1;
  return letters.slice(from, to).join("");
}

/** The words in a piece of text, each stripped of the punctuation around it. */
function words(prose) {
  return prose
    .split(/\s+/u)
    .filter((word) => word !== "")
    .map(bare);
}

// ── Idiom and cultural reference ────────────────────────────────────────

/**
 * Turns of phrase that do not survive being read by somebody who learned English
 * second, or translated.
 *
 * Not an exhaustive list of idiom — no such list exists — but the ones reaching
 * for a sport, a war or a piece of folk wisdom, which fail hardest: somebody who
 * does not know that a ballpark is a place where baseball is played has no way to
 * reach "approximate" from it, and no dictionary will take them there either.
 */
const IDIOMS = [
  "out of the box",
  "under the hood",
  "at the end of the day",
  "on the fly",
  "rule of thumb",
  "silver bullet",
  "cut corners",
  "off the shelf",
  "ballpark",
  "touch base",
  "low-hanging fruit",
  "sanity check",
  "bite the bullet",
  "in the weeds",
  "piece of cake",
  "elephant in the room",
  "home run",
  "curveball",
  "slam dunk",
  "level playing field",
  "spanner in the works",
  "boil the ocean",
  "bells and whistles",
  "chicken and egg",
  "smoke and mirrors",
  "tip of the iceberg",
  "red herring",
  "the last straw",
  "first base",
  "back to square one",
];

/** The idioms one message leans on. */
function idioms(said) {
  const plainly = withoutPlaceholders(said).toLowerCase();
  return IDIOMS.filter((idiom) => plainly.includes(idiom));
}

// ── Acronyms ────────────────────────────────────────────────────────────

/**
 * Short capitals a person needs no help with, and why each is allowed.
 *
 * Empty, and that is the state to keep it in: this console writes to a household
 * as well as to an operator, and it has so far needed none.
 *
 * A word belongs here when it is met everywhere and is not this ecosystem's own —
 * somebody running a media stack has already met a URL. A word this stack explains
 * does not belong here, whatever it costs to avoid: declaring `NZB` ordinary would
 * be writing down a judgement nobody made, and the console asking the binary what
 * a word means is the answer that keeps one explanation of it.
 */
const ORDINARY = new Set();

/**
 * Every run of two or more capitals in a word, with names left out.
 *
 * A run that runs straight into a lower-case letter is part of a word rather than
 * an abbreviation of one: `SABnzbd` and `QBittorrent` are names. A digit inside a
 * run belongs to it, `WSL2` being one abbreviation rather than one and a number.
 */
function runsOfCapitals(word) {
  const found = [];
  let run = "";
  for (const letter of word) {
    if (/[A-Z]/u.test(letter) || (run !== "" && /\d/u.test(letter))) {
      run += letter;
      continue;
    }
    if (run.length > 1 && !/[a-z]/u.test(letter)) found.push(run);
    run = "";
  }
  if (run.length > 1) found.push(run);
  return found;
}

/**
 * The acronyms in one message that were not declared ordinary.
 *
 * A domain term used without an explanation is a defect, and most jargon cannot be
 * told from ordinary writing by a machine. An acronym can be, and it is jargon at
 * its sharpest: somebody who does not know `NZB` cannot infer it from the letters,
 * cannot look it up under a word they never saw spelled out, and has nothing to go
 * on but the sentence around it. So this refuses the whole class rather than a list
 * of known offenders — a new acronym cannot reach a reader without somebody
 * deciding which it is.
 *
 * The binary's twin checks only literals that read as sentences, its corpus being
 * a source tree where an environment variable and a command-line placeholder also
 * wear capitals. Every message here was written to be read, so every message here
 * is checked, bare labels among them — which is where an acronym costs most.
 */
function acronyms(said, ordinary) {
  return words(withoutPlaceholders(said))
    .flatMap((word) => runsOfCapitals(word))
    .filter((short) => !ordinary.has(short));
}

// ── Never the reader's fault ────────────────────────────────────────────

/**
 * Words that name something done wrong.
 *
 * A fault, not a person: this product says "the key is wrong" about a key and is
 * right to. These are read together with the words for the person rather than on
 * their own, what turns a fault into blame being who is standing next to it.
 */
const FAULT = new Set([
  "wrong",
  "wrongly",
  "invalid",
  "incorrect",
  "incorrectly",
  "broke",
  "broken",
  "failed",
  "forgot",
  "forgotten",
  "mistake",
  "mistakes",
  "mistyped",
  "misspelled",
  "misconfigured",
  "misused",
  "error",
  "errors",
  "fault",
  "blame",
  "careless",
  "carelessly",
  "neglected",
  "botched",
  "messed",
  "sloppy",
  "supposed",
]);

/** The person reading, in the words a message would name them by. */
const READER = new Set([
  "you",
  "your",
  "yours",
  "yourself",
  "you're",
  "you've",
  "you'd",
  "you'll",
]);

/** How near a fault has to stand to the person before it is being said of them. */
const NEARBY = 4;

/**
 * Blame that names nobody, and means the reader anyway.
 *
 * Each needs its exact sequence rather than two words standing near each other:
 * "input" and "error" are ordinary on their own, and it is the pairing that decides
 * somebody typed the wrong thing.
 */
const BLAMING = [
  "user error",
  "operator error",
  "human error",
  "pilot error",
  "invalid input",
  "bad input",
  "you should have",
  "you should not have",
  "you shouldn't have",
  "you ought to have",
  "this is on you",
];

/** Every fault named within `NEARBY` words of the person reading. */
function faultsBesideTheReader(plainly) {
  const said = words(plainly);
  const found = [];
  said.forEach((word, at) => {
    if (!FAULT.has(word)) return;
    const near = said.slice(
      Math.max(0, at - NEARBY),
      Math.min(said.length, at + NEARBY + 1),
    );
    const reader = near.find((word) => READER.has(word));
    if (reader !== undefined) found.push(`${reader} … ${word}`);
  });
  return found;
}

/**
 * The blaming constructions in one message.
 *
 * What this refuses is a fault named beside the person reading, not the second
 * person itself. Saying what the reader did is how this product defers to them;
 * blame is what happens when a fault word joins it.
 */
function blaming(said) {
  const plainly = withoutPlaceholders(said).toLowerCase();
  return [
    ...BLAMING.filter((blame) => plainly.includes(blame)),
    ...faultsBesideTheReader(plainly),
  ];
}

// ── Every rule, shown refusing before it is relied on ────────────────────

/**
 * What each rule must refuse, and what it must let through.
 *
 * A sweep that finds nothing looks exactly like a rule that catches nothing, and
 * the corpus is clean, so every run proves the rules still work before it reports
 * that they found nothing. A list quietly widened until it catches everything — or
 * narrowed until it catches nothing — fails here rather than looking green.
 */
const PROVEN = [
  {
    rule: "idiom",
    find: idioms,
    refuses: [
      "It works out of the box, so there is nothing to set up",
      "A rule of thumb is one disk for everything",
      "What is under the hood is the same on every machine",
    ],
    allows: [
      "Downloads stop where they are, and nothing is deleted",
      "One disk, which is what lets downloads be linked instead of copied",
      "Nothing is filling it fast.",
    ],
  },
  {
    rule: "acronym",
    find: (said) => acronyms(said, ORDINARY),
    refuses: [
      "Your NZB provider keeps things for this long",
      "The VPN carries your downloading",
      "HDR",
    ],
    allows: [
      "Your provider keeps things for this long",
      "Hides your downloading from your provider",
      "SABnzbd is answering",
    ],
  },
  {
    rule: "acronym declared ordinary",
    find: (said) => acronyms(said, new Set(["URL"])),
    refuses: [
      "Paste the NZB on the line that says where lemonfiber is listening",
    ],
    allows: [
      "Paste the URL on the line that says where lemonfiber is listening",
    ],
  },
  {
    rule: "blame",
    find: blaming,
    refuses: [
      "You forgot to choose a folder",
      "The key you entered is wrong",
      "Your settings are invalid",
      "you should have run setup first",
      "user error",
    ],
    allows: [
      "The key is wrong, expired, or for a different indexer",
      "Whatever went wrong is usually in their own output, which is below.",
      "You have changed this since lemonfiber wrote it, so it is left alone",
      "At least one check failed. Each one below says what it means.",
    ],
  },
];

for (const { rule, find, refuses, allows } of PROVEN) {
  for (const said of refuses) {
    if (find(said).length === 0)
      fail(`the ${rule} rule`, `lets this through, and must not: "${said}"`);
  }
  for (const said of allows) {
    const found = find(said);
    if (found.length > 0)
      fail(
        `the ${rule} rule`,
        `refuses this, and must not: "${said}" (${found.join(", ")})`,
      );
  }
}

// ── The sweep ───────────────────────────────────────────────────────────

/**
 * How little the sweep may read before it is reading the wrong thing.
 *
 * Every rule reports what it found, so a reader that stopped finding anything
 * would pass all of them at once and look like a console with nothing to answer
 * for. Both are checked: a file of empty strings clears the first and not the
 * second.
 */
const FLOOR_MESSAGES = 250;
const FLOOR_CHARACTERS = 6_000;

const said = Object.entries(JSON.parse(readFileSync(CORPUS, "utf8"))).filter(
  ([key]) => key !== SCHEMA,
);
const characters = said.reduce(
  (total, [, message]) => total + message.length,
  0,
);

if (said.length < FLOOR_MESSAGES || characters < FLOOR_CHARACTERS)
  fail(
    "the sweep",
    `read ${String(said.length)} messages and ${String(characters)} characters, ` +
      `under the floor of ${String(FLOOR_MESSAGES)} and ${String(FLOOR_CHARACTERS)} — ` +
      "it is reading the wrong file, or a file that no longer holds the words",
  );

for (const [key, message] of said) {
  const where = `messages/en.json  ${key}`;

  for (const idiom of idioms(message))
    fail(
      where,
      `"${idiom}" does not survive translation, and says nothing a plain word would not`,
    );

  for (const short of acronyms(message, ORDINARY))
    fail(
      where,
      `"${short}" is shown with nothing to make sense of it — ask the binary what it means, or declare it ordinary with a reason`,
    );

  for (const blame of blaming(message))
    fail(
      where,
      `"${blame}" puts the failure on the person reading — say what is wrong, not who got it wrong`,
    );
}

if (failures.length > 0) {
  console.error(`words: ${String(failures.length)} violation(s)\n`);
  for (const found of failures) console.error(`  ${found}`);
  process.exit(1);
}
console.log(
  `words: clean (${String(said.length)} messages, ${String(characters)} characters)`,
);
