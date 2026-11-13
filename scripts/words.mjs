#!/usr/bin/env node
/**
 * The words this console ships, held to the rules the binary's words are held to.
 *
 * Each rule here has a twin in the binary's own sweep over its string literals.
 * That sweep reads only paths inside its own repository, and this surface is a
 * separate one, so rules written to hold across every surface reached one of them.
 *
 * The corpus is the base locale's catalogue files under `messages/`, as
 * `project.inlang/settings.json` names them for the compiler, and nothing else.
 * That is the whole of what a person reads here. `scripts/guards.mjs` refuses
 * prose anywhere else in the tree, so the collection point it enforces is what
 * makes this sweep complete rather than a sample of the words.
 *
 * A drawn screen is deliberately not the corpus. It carries another service's
 * name, a release title and whatever a daemon said back, and a sweep reading it
 * would be scanning words this product did not write.
 *
 * Two rules read beyond the base locale's words, and only to place them. A
 * label is told from a sentence by where its key is drawn, so the screens'
 * sources are read for the props and elements that draw one (`G2-R15`). A
 * declared name is held to every other locale the settings name, each read
 * against the base locale it translates (`G2-R14`).
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SETTINGS = JSON.parse(
  readFileSync(join(ROOT, "project.inlang", "settings.json"), "utf8"),
);

/** Every catalogue file one locale is compiled from, in the order named. */
const catalogueOf = (locale) =>
  [SETTINGS["plugin.inlang.messageFormat"].pathPattern]
    .flat()
    .map((pattern) => join(ROOT, pattern.replace("{locale}", locale)));

/** Every catalogue file the base locale is compiled from, in the order named. */
const CORPUS = catalogueOf(SETTINGS.baseLocale);

/** Every locale beside the base one, each of which is a translation of it. */
const TRANSLATIONS = SETTINGS.locales.filter(
  (locale) => locale !== SETTINGS.baseLocale,
);

/** The key inlang uses for the file's own schema, which nobody reads. */
const SCHEMA = "$schema";

const failures = [];
const fail = (where, message) => {
  failures.push(`${where}  ${message}`);
};

// ── What a message says, with the parts nobody reads taken out ───────────

/**
 * The text with every `{…}` removed, a placeholder being data inside a sentence,
 * or put in place of `standIn` where it is to be counted rather than read.
 *
 * What arrives in one is a release title, a service name, a path or a figure —
 * words this product did not write and cannot be answerable for.
 */
function withoutPlaceholders(said, standIn = "") {
  let prose = "";
  let depth = 0;
  for (const character of said) {
    if (character === "{") {
      if (depth === 0) prose += standIn;
      depth += 1;
    } else if (character === "}") depth = Math.max(0, depth - 1);
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

/** What a run is made of: capitals, and the digits standing among them. */
const OF_A_RUN = /[A-Z\d]/u;

/** A capital, which an abbreviation has and a figure has not. */
const CAPITAL = /[A-Z]/u;

/** A lower-case letter, which is a word carrying on rather than a run ending. */
const LOWER = /[a-z]/u;

/** The one letter that pluralises an abbreviation rather than continuing a word. */
const PLURAL = "s";

/**
 * Every run of two or more capitals in a word, with names and figures left out.
 *
 * A run that runs straight into a lower-case word is part of that word rather than
 * an abbreviation of one: `SABnzbd` and `qBittorrent` are names. A single trailing
 * `s` is no such word — `NZBs` is an `NZB`, and reading a plural as a name is how
 * every acronym in the language walks past this rule.
 *
 * A digit belongs to the run it touches on either side, `WSL2` and `4K` each being
 * one abbreviation rather than a figure beside a word. A run of digits alone is a
 * figure, which is nobody's jargon.
 */
function runsOfCapitals(word) {
  const letters = [...word];
  const found = [];
  let run = "";

  /** Whether the run ending at `at` is the head of a lower-case word. */
  const name = (at) =>
    LOWER.test(letters[at] ?? "") &&
    !(letters[at] === PLURAL && at === letters.length - 1);

  /** Take the run that ends at `at`, if what it ends against leaves it one. */
  const close = (at) => {
    if (run.length > 1 && CAPITAL.test(run) && !name(at)) found.push(run);
    run = "";
  };

  for (const [at, letter] of letters.entries()) {
    if (OF_A_RUN.test(letter)) run += letter;
    else close(at);
  }
  close(letters.length);

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

// ── An explanation of a word belongs to the table that holds the words ───

/** Key shapes that file a message as an account of what a word means. */
const EXPLAINS =
  /_(?:meaning|definition|explanation|explained|glossary|jargon)$/;

/**
 * The most words a label holds before it is a sentence: a term's own message,
 * and anything drawn as a control's label or a heading, a declared name
 * counting as one (`G2-R15`).
 */
const A_LABEL = 3;

/**
 * The explanations one message carries, which is any explanation at all.
 *
 * This ecosystem's vocabulary lives in one table, compiled into the binary and
 * served from it. A message here saying what one of those words means is a second
 * answer to the same question, kept in a different repository from the behaviour it
 * describes — which is how this console came to explain `hardlink` in a sentence
 * the table it was copied out of does not contain.
 *
 * Two shapes are refused: a key filed as an account of a word, and a `term_` key
 * grown past the label it holds into a sentence. An explanation filed under a key
 * that looks like neither is not caught, and cannot be from here: telling a
 * definition from ordinary writing needs the vocabulary, and the vocabulary is
 * answered by a running binary rather than read at build time.
 */
function explanations(said, key) {
  if (EXPLAINS.test(key)) return [key];
  const prose = words(withoutPlaceholders(said));
  return key.startsWith("term_") && prose.length > A_LABEL ? [key] : [];
}

/**
 * Every key a catalogue file writes at its top level, in the order written,
 * the ones written twice included.
 *
 * Read from the text rather than from what `JSON.parse` returns, which keeps
 * the last of two equal keys and says nothing of the first.
 */
function keysWritten(text) {
  const keys = [];
  let depth = 0;
  let at = 0;
  while (at < text.length) {
    const character = text[at];
    if (character === '"') {
      const end = closingQuote(text, at);
      if (depth === 1 && text[nextWritten(text, end + 1)] === ":") {
        keys.push(JSON.parse(text.slice(at, end + 1)));
      }
      at = end;
    } else {
      depth += OPENS.has(character) ? 1 : 0;
      depth -= CLOSES.has(character) ? 1 : 0;
    }
    at += 1;
  }
  return keys;
}

/** What opens a level of a document, and what closes one. */
const OPENS = new Set(["{", "["]);
const CLOSES = new Set(["}", "]"]);

/** Where the string that opens at `at` closes, stepping over each escape. */
function closingQuote(text, at) {
  let end = at + 1;
  while (end < text.length && text[end] !== '"') {
    end += text[end] === "\\" ? 2 : 1;
  }
  return end;
}

/** Where the next character that is not space stands, from `from` on. */
function nextWritten(text, from) {
  let at = from;
  while (at < text.length && /\s/u.test(text[at])) at += 1;
  return at;
}

/** Every key a catalogue file writes more than once. */
function keptTwice(text) {
  const seen = new Set();
  const twice = new Set();
  for (const key of keysWritten(text)) {
    if (seen.has(key)) twice.add(key);
    seen.add(key);
  }
  return [...twice];
}

// ── The names this product gives its own things ─────────────────────────

/**
 * The words that also name a file, a command or an argument, each with where it
 * names one (`G2-R14`).
 *
 * Declared rather than inferred: nothing in a sentence says whether a noun is
 * text or a name, and a name nobody wrote down here is one a translator will
 * reasonably translate. A translation that turns one into the ordinary word a
 * dictionary gives hands the reader a word that appears in no compose file, no
 * command and no page of the documentation they would search.
 */
const DECLARED = new Map([
  [
    "form",
    "a group of services that start and stop together, and the argument the verbs acting on one take",
  ],
  [
    "stack",
    "the machine every command acts on, in every path and every page of the documentation",
  ],
]);

/**
 * Whether a line uses a name as a word rather than as the start of one.
 *
 * Both edges, and the near miss is why: a translation beginning with the name,
 * the way _formulier_ begins with _form_, is the exact mistranslation this rule
 * is for, and a rule anchored at the front alone would read it as a match. An
 * English plural is the same name.
 */
function naming(line, name) {
  return new RegExp(String.raw`\b${name}s?\b`, "iu").test(line);
}

/**
 * The declared names a translation of one message drops.
 *
 * No list of wrong words: where the base locale names a thing, the translation
 * must name it too, and whatever a translator wrote instead never has to be
 * guessed at.
 */
function namesDropped(source, translated) {
  return [...DECLARED.keys()].filter(
    (name) =>
      naming(withoutPlaceholders(source), name) &&
      !naming(withoutPlaceholders(translated), name),
  );
}

// ── A label names what it opens or does ─────────────────────────────────

/**
 * How many words a label holds as it is read.
 *
 * A placeholder is one word: what fills it is a name or a figure, and it is the
 * thing the label names. A declared name is one word by being one.
 */
function labelLength(said) {
  return words(withoutPlaceholders(said, " placeholder")).filter(
    (word) => word !== "",
  ).length;
}

/** A label that has grown into a sentence, as the words that make it one. */
function sentenced(said) {
  return labelLength(said) > A_LABEL ? [said] : [];
}

/**
 * Where a message is drawn as a label: the component and the prop that names a
 * control, a menu item, a strip of places or a section, and the elements a
 * section heading and a disclosure are drawn in.
 *
 * Known by where it is used rather than by how its key is spelled, since a key
 * says which area a message belongs to and nothing about what it is drawn as.
 */
const LABEL_SLOTS = [
  ["Action", "label"],
  ["MenuItem", "label"],
  ["Switch", "label"],
  ["CheckLine", "label"],
  ["Field", "label"],
  ["Segmented", "label"],
  ["SubNav", "label"],
  ["Panel", "title"],
  ["SettingRow", "title"],
  ["WizardStep", "title"],
];

/** The elements whose own words are a heading or what a disclosure opens. */
const LABEL_ELEMENTS = /<(h[1-6]|summary)\b[^>]*>\s*\{\s*m\.(\w+)\(/gu;

/** A field of an option, a place or a column that is drawn as its label. */
const LABEL_FIELDS = /\b(?:label|head):\s*m\.(\w+)\(/gu;

/** A message read inside an expression. */
const MESSAGE = /\bm\.(\w+)\(/gu;

/** Where the tag that opens at `at` closes, stepping over braces and quotes. */
function tagEnd(source, at) {
  let depth = 0;
  let quote;
  for (let end = at; end < source.length; end += 1) {
    const character = source[end];
    if (quote !== undefined) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'" || character === "`") {
      quote = character;
    } else if (character === "{") depth += 1;
    else if (character === "}") depth -= 1;
    else if (character === ">" && depth === 0) return end;
  }
  return source.length;
}

/** Every message one prop of a tag reads, however the value is put together. */
function messagesOf(tag, prop) {
  const found = [];
  const opening = new RegExp(String.raw`(?<![\w-])${prop}=\{`, "gu");
  for (const match of tag.matchAll(opening)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < tag.length && depth > 0) {
      if (tag[end] === "{") depth += 1;
      else if (tag[end] === "}") depth -= 1;
      end += 1;
    }
    const value = tag.slice(match.index + match[0].length, end - 1);
    for (const [, key] of value.matchAll(MESSAGE)) found.push(key);
  }
  return found;
}

/** Every message one source file draws as a label. */
function labelsIn(source) {
  const found = [];
  for (const [component, prop] of LABEL_SLOTS) {
    for (const match of source.matchAll(
      new RegExp(String.raw`<${component}\b`, "gu"),
    )) {
      const tag = source.slice(match.index, tagEnd(source, match.index));
      found.push(...messagesOf(tag, prop));
    }
  }
  for (const [, , key] of source.matchAll(LABEL_ELEMENTS)) found.push(key);
  for (const [, key] of source.matchAll(LABEL_FIELDS)) found.push(key);
  return found;
}

/**
 * The areas whose every message names a place in a menu: a member's rooms and
 * the console's places, which `src/lib/rooms.ts` and `src/lib/route.ts` name.
 */
const MENU_AREAS = new Set(["room", "nav"]);

// ── Every rule, shown refusing before it is relied on ────────────────────

/**
 * What each rule must refuse, and what it must let through.
 *
 * A sweep that finds nothing looks exactly like a rule that catches nothing, and
 * the corpus is clean, so every run proves the rules still work before it reports
 * that they found nothing. A list quietly widened until it catches everything — or
 * narrowed until it catches nothing — fails here rather than looking green.
 *
 * A case is a message, or a key and the message filed under it where the rule reads
 * both. The key a bare message is proved under names nothing and is filed nowhere.
 */
const PROVEN = [
  {
    rule: "a key kept twice in one file",
    find: keptTwice,
    refuses: [
      '{ "panel_a": "One", "panel_a": "Two" }',
      String.raw`{ "a_b": "x", "c_d": "y \" with a quote", "a_b": "z" }`,
    ],
    allows: [
      '{ "panel_a": "One", "panel_b": "One" }',
      String.raw`{ "a_b": "it says \"a_b\": twice in its text" }`,
    ],
  },
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
      "Paste the URLs and NZBs and check the APIs",
      "4K films take more room",
      "It runs under WSL2",
    ],
    allows: [
      "Your provider keeps things for this long",
      "Hides your downloading from your provider",
      "SABnzbd is answering",
      "qBittorrent is answering",
      "Around 1080 files are waiting",
      "Every film here is 1080p",
    ],
  },
  {
    rule: "acronym declared ordinary",
    find: (said) => acronyms(said, new Set(["URL"])),
    refuses: [
      "Paste the NZB on the line that says where lemonfiber is listening",
      "Paste the NZBs on the line that says where lemonfiber is listening",
    ],
    allows: [
      "Paste the URL on the line that says where lemonfiber is listening",
      "Paste the URLs on the line that says where lemonfiber is listening",
    ],
  },
  {
    rule: "explanation",
    find: explanations,
    refuses: [
      [
        "term_hardlink_meaning",
        "One file in two places, taking the room of one",
      ],
      [
        "term_stale_meaning",
        "The last figure a service gave before it stopped",
      ],
      ["term_indexer", "Search engines that find what you are looking for"],
    ],
    allows: [
      ["term_hardlink", "linking"],
      ["head_what_that_means", "What that means"],
      ["panel_dead_scope", "Nothing in this box can be trusted right now."],
    ],
  },
  {
    rule: "declared name",
    find: (translated, source) => namesDropped(source, translated),
    refuses: [
      ["Start the form", "Start het formulier"],
      ["The stack is answering", "Die Anlage antwortet"],
      ["Every form in the stack", "Elk formulier in de stapel"],
    ],
    allows: [
      ["Start the form", "Start de form"],
      ["Both forms are running", "Beide forms draaien"],
      ["Nothing is running", "Er draait niets"],
    ],
  },
  {
    rule: "label",
    find: sentenced,
    refuses: [
      "Why it is not the door",
      "Opened from a terminal?",
      "Show me {count} more of them",
    ],
    allows: ["Ask for something", "Found for {term}", "Try again", "Search"],
  },
  {
    rule: "label slot",
    find: labelsIn,
    refuses: [
      '<Action label={m.found_ask()} weight="firm" />',
      "<Action\n  label={sending ? m.found_asking() : m.found_ask()}\n  onclick={() => go(a > b)}\n/>",
      '<Panel stamped="quiet" title={m.found_for({ term })} {freshness}>',
      '<h2 id="{uid}-title" class="said">{m.found_title()}</h2>',
      "<summary>{m.wayin_key_open()}</summary>",
      "{ head: m.head_asked_for() },",
      '{ value: "a", label: m.policy_label_trusted() }',
    ],
    allows: [
      '<Banner tone="watch" lead={m.member_unanswered_lead()} />',
      '<Skeleton width="16rem" label={m.waiting_answer()} />',
      '<p class="line">{m.found_first()}</p>',
      "<Action label={label} onclick={go} />",
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

/**
 * One proving case, as the key it is filed under and what it says, or as the
 * line a translation is of and the translation.
 */
const filed = (one) => (typeof one === "string" ? ["proved", one] : one);

for (const { rule, find, refuses, allows } of PROVEN) {
  for (const [key, said] of refuses.map(filed)) {
    if (find(said, key).length === 0)
      fail(`the ${rule} rule`, `lets this through, and must not: "${said}"`);
  }
  for (const [key, said] of allows.map(filed)) {
    const found = find(said, key);
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

// ── Which file holds a message ───────────────────────────────────────────

/**
 * Each message with the file it is kept in.
 *
 * The compiler merges the files into one set of keys, so a key kept twice is
 * one of them silently replaced. A key's area is the part before its first
 * underscore, and an area lives in one file: that is what tells a writer where
 * a new key goes.
 */
const said = [];
const keptIn = new Map();
const areaIn = new Map();
for (const path of CORPUS) {
  const file = relative(ROOT, path);
  const text = readFileSync(path, "utf8");
  for (const key of keptTwice(text))
    fail(
      `${file}  ${key}`,
      "is kept twice in this file — the compiler keeps the last and drops the first without a word",
    );
  const messages = Object.entries(JSON.parse(text));
  for (const [key, message] of messages) {
    if (key === SCHEMA) continue;
    const before = keptIn.get(key);
    if (before === undefined) keptIn.set(key, file);
    else
      fail(`${file}  ${key}`, `is kept in ${before} too — keep it in one file`);
    const area = key.split("_")[0];
    const home = areaIn.get(area);
    if (home === undefined) areaIn.set(area, file);
    else if (home !== file)
      fail(
        `${file}  ${key}`,
        `belongs with the other ${area}_ keys in ${home}`,
      );
    said.push([file, key, message]);
  }
}

/**
 * A catalogue file the settings do not name is one the compiler never reads,
 * so every key in it is a word no screen can show.
 */
for (const folder of new Set(CORPUS.map((path) => dirname(path))))
  for (const name of readdirSync(folder))
    if (name.endsWith(".json") && !CORPUS.includes(join(folder, name)))
      fail(
        relative(ROOT, join(folder, name)),
        "is not named in project.inlang/settings.json, so nothing compiles it",
      );

const characters = said.reduce(
  (total, [, , message]) => total + message.length,
  0,
);

if (said.length < FLOOR_MESSAGES || characters < FLOOR_CHARACTERS)
  fail(
    "the sweep",
    `read ${String(said.length)} messages and ${String(characters)} characters, ` +
      `under the floor of ${String(FLOOR_MESSAGES)} and ${String(FLOOR_CHARACTERS)} — ` +
      "it is reading the wrong file, or a file that no longer holds the words",
  );

for (const [file, key, message] of said) {
  const where = `${file}  ${key}`;

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

  for (const named of explanations(message, key))
    fail(
      where,
      `${named} says what one of this ecosystem's words means — the words are one table in the binary, and this surface asks it rather than keeping a copy`,
    );
}

// ── Each translation keeps the declared names ───────────────────────────

const base = new Map(said.map(([, key, message]) => [key, message]));

for (const locale of TRANSLATIONS) {
  for (const path of catalogueOf(locale)) {
    const file = relative(ROOT, path);
    for (const [key, translated] of Object.entries(
      JSON.parse(readFileSync(path, "utf8")),
    )) {
      const source = base.get(key);
      if (key === SCHEMA || source === undefined) continue;
      for (const name of namesDropped(source, translated))
        fail(
          `${file}  ${key}`,
          `translates "${name}", a name this product gives one of its own things — it names ${String(DECLARED.get(name))}, and is rendered as declared in every locale`,
        );
    }
  }
}

// ── Every label names what it opens or does ─────────────────────────────

/** Where the screens are, which is where a message is drawn as a label. */
const SOURCES = join(ROOT, "src");

/** A file a screen is drawn from, rather than a suite, a story or compiled words. */
const DRAWS = /\.(?:svelte|ts)$/u;
const NOT_DRAWN = /(?:\.test\.ts|\.testing\.ts|\.stories\.ts)$|^paraglide\//u;

/** Each message drawn as a label, with the first place it is drawn. */
const labels = new Map();
for (const name of readdirSync(SOURCES, { recursive: true })) {
  const file = String(name);
  if (!DRAWS.test(file) || NOT_DRAWN.test(file)) continue;
  const source = readFileSync(join(SOURCES, file), "utf8");
  for (const key of labelsIn(source))
    if (!labels.has(key)) labels.set(key, `src/${file}`);
}
for (const key of base.keys())
  if (MENU_AREAS.has(key.split("_")[0]) && !labels.has(key))
    labels.set(key, "a menu");

/** How few labels the sweep may find before it is reading the wrong thing. */
const FLOOR_LABELS = 150;

if (labels.size < FLOOR_LABELS)
  fail(
    "the label sweep",
    `found ${String(labels.size)} labels, under the floor of ${String(FLOOR_LABELS)} — it is reading the wrong files, or no longer recognises where a label is drawn`,
  );

for (const [key, where] of labels) {
  const message = base.get(key);
  if (message === undefined) continue;
  for (const label of sentenced(message))
    fail(
      `${String(keptIn.get(key))}  ${key}`,
      `"${label}" is drawn as a label in ${where} and holds ${String(labelLength(label))} words — a label names what it opens or does in at most ${String(A_LABEL)}, and a sentence may explain beside it`,
    );
}

if (failures.length > 0) {
  console.error(`words: ${String(failures.length)} violation(s)\n`);
  for (const found of failures) console.error(`  ${found}`);
  process.exit(1);
}
console.log(
  `words: clean (${String(said.length)} messages, ${String(characters)} characters, ${String(labels.size)} labels)`,
);
