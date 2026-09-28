/**
 * Every request another surface can make of the stack, and every kind of answer
 * the client carries, classified as offered here, offered elsewhere by rule, or
 * not yet offered.
 *
 * **Three lists, and no count kept by hand.** A number of unoffered things that
 * may only fall blames whoever is standing nearest when the stack grows a kind.
 * Naming every one instead makes a new one *unclassified*, which fails saying
 * which it is.
 *
 * The kinds are read off the client: the declaration `@lemonfiber/sdk-ts` ships
 * states every kind the contract names. The requests are not in the client — it
 * asks for an action by whatever name it is handed — so they are listed here as
 * the core's action table names them, with the setup walk and the one request
 * that serves this surface beside them. A new action the core adds is caught here
 * only where it answers with a kind the contract did not have before.
 *
 * Each list is held to being true, in both directions. A kind claimed offered is
 * one something the page imports reads; a request claimed offered is on a list a
 * screen the console draws walks; and nothing read or walked is still waiting in
 * another list. `docs/surface-parity.md` states the counts these lists come to
 * and names every one still waiting, and is held to both.
 */
/// <reference types="vite/client" />
import type { Kind } from "@lemonfiber/sdk-ts";
import { everyConfiguring } from "./lib/configuring";
import { everyMending } from "./lib/mending";
import { everyTending } from "./lib/tending";
import { everyTuning } from "./lib/tuning";
import { everyUpkeep } from "./lib/upkeep";
import { everyDoing } from "./lib/work";
import declared from "../node_modules/@lemonfiber/sdk-ts/dist/index.d.mts?raw";
import written from "../docs/surface-parity.md?raw";

/** A feature of the spec, which is what a request still waiting belongs to. */
type Feature =
  | "A2"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "B2"
  | "B5"
  | "B10"
  | "C1"
  | "C3"
  | "C4"
  | "C5"
  | "C7"
  | "C9"
  | "D1"
  | "D2"
  | "D3"
  | "D5"
  | "D6"
  | "D7"
  | "D8"
  | "D9"
  | "D10"
  | "E1"
  | "E2"
  | "E3"
  | "E4"
  | "F2"
  | "F4"
  | "F6"
  | "G2"
  | "G5"
  | "G6"
  | "G8"
  | "N1";

/**
 * Every request another surface can make of the stack.
 *
 * The core's actions in the order its table lists them, then the setup walk its
 * own endpoints serve, then serving this surface, which the command line does,
 * then replacing the certificate a paired phone pins, which only the command
 * line offers.
 */
const EVERY_REQUEST = [
  "up",
  "down",
  "switch",
  "restart",
  "pull",
  "config-set",
  "quality-set",
  "quality-reapply",
  "quality-upgrade",
  "seed",
  "adopt",
  "migrate-adopt",
  "migrate-beside",
  "migrate-replace",
  "migrate-import",
  "reset",
  "forget",
  "uninstall",
  "space",
  "stop-seeding",
  "bandwidth",
  "update",
  "backup",
  "invite",
  "remove",
  "reissue",
  "companion-pair",
  "household-allow",
  "household-approve",
  "household-decline",
  "support",
  "restore",
  "watch",
  "hosting-install",
  "hosting-remove",
  "walkthrough",
  "diagnose",
  "repair",
  "undo",
  "accept",
  "search",
  "setup",
  "ui",
  "companion-certificate",
] as const;

/** One request another surface can make. */
type Request = (typeof EVERY_REQUEST)[number];

/**
 * The lists of requests a screen walks, and the screen that walks each.
 *
 * A request is offered by being on one of these, drawn as a control on the
 * screen named. The list is imported rather than restated, so what is claimed
 * is what the screen is handed, and the screen either walks the list by name
 * or names each request in it.
 */
const WALKED: readonly {
  readonly list: readonly Request[];
  readonly named: string;
  readonly by: readonly string[];
}[] = [
  {
    list: everyDoing,
    named: "everyDoing",
    by: ["src/routes/panels/Running.svelte"],
  },
  {
    list: everyMending,
    named: "everyMending",
    by: ["src/routes/panels/Mend.svelte"],
  },
  {
    list: everyUpkeep,
    named: "everyUpkeep",
    by: [
      "src/routes/panels/Backups.svelte",
      "src/routes/panels/Support.svelte",
    ],
  },
  {
    list: everyTuning,
    named: "everyTuning",
    by: ["src/routes/panels/Quality.svelte"],
  },
  {
    list: everyConfiguring,
    named: "everyConfiguring",
    by: ["src/routes/panels/Configuration.svelte"],
  },
  {
    list: everyTending,
    named: "everyTending",
    by: ["src/routes/panels/Tending.svelte", "src/routes/panels/Tended.svelte"],
  },
];

/** Requests this console offers. */
const OFFERED_REQUESTS: readonly Request[] = [
  "up",
  "down",
  "switch",
  "restart",
  "pull",
  "seed",
  "adopt",
  "repair",
  "diagnose",
  "accept",
  "undo",
  "backup",
  "restore",
  "support",
  "quality-reapply",
  "quality-upgrade",
  "config-set",
  "invite",
  "reissue",
  "household-allow",
  "household-approve",
  "household-decline",
];

/**
 * Requests this console does not offer because a requirement says it cannot,
 * each with that requirement and why.
 */
const ELSEWHERE_REQUESTS: Partial<Record<Request, string>> = {
  ui: "G1-R1 — a surface cannot start itself; the address bar is the equivalent, since being able to ask is proof it is already serving",
};

/** Requests nobody has offered here yet, each with the feature it belongs to. */
const NOT_YET_REQUESTS: Partial<Record<Request, Feature>> = {
  "quality-set": "D2",
  "migrate-adopt": "A5",
  "migrate-beside": "A5",
  "migrate-replace": "A5",
  "migrate-import": "A5",
  reset: "C9",
  forget: "A6",
  uninstall: "A6",
  space: "D5",
  "stop-seeding": "D5",
  bandwidth: "D10",
  update: "E1",
  remove: "D6",
  "companion-pair": "N1",
  watch: "C5",
  "hosting-install": "B10",
  "hosting-remove": "B10",
  walkthrough: "D3",
  search: "D9",
  setup: "A2",
  "companion-certificate": "N1",
};

/** Kinds something the page imports reads. */
const OFFERED_KINDS: readonly Kind[] = [
  "admission",
  "archives",
  "backup",
  "bundle",
  "config",
  "dashboard",
  "doctor",
  "forms",
  "household",
  "invitation",
  "job",
  "lifecycle",
  "log",
  "preview",
  "quality",
  "repair",
  "restore",
  "seed",
  "start",
  "status",
  "undo",
  "upgrade",
];

/**
 * Kinds the client reads on this page's behalf, each with the export of the
 * client's that does.
 *
 * A refusal is one: the client reads the envelope a failure is rendered in and
 * hands back its sentence, so nothing here opens it by name.
 */
const THROUGH_THE_CLIENT: Partial<Record<Kind, string>> = {
  error: "refusalIn",
};

/**
 * Kinds no endpoint serves, each with the requirement that says why none has
 * to.
 */
const ELSEWHERE_KINDS: Partial<Record<Kind, string>> = {
  pull: "G1-R1 — the lines the command line writes while it fetches, under `--json`, which is how a command writes its answer to a pipe; the web offers fetching through the `pull` request, answered with `lifecycle`",
  setup:
    "G1-R1 — what the command line's own setup writes under `--json`; the setup a browser walks answers with `wizard`",
};

/** Kinds nobody here reads yet, each with the feature it belongs to. */
const NOT_YET_KINDS: Partial<Record<Kind, Feature>> = {
  adoption: "A5",
  alerts: "B5",
  bandwidth: "D10",
  beside: "A5",
  catalogue: "F2",
  certificate: "N1",
  clients: "G6",
  credentials: "A7",
  "front-door": "G5",
  glossary: "G2",
  held: "D8",
  history: "E4",
  hosting: "B10",
  import: "A5",
  migration: "A5",
  music: "D2",
  outbound: "G8",
  pairing: "N1",
  plugins: "F6",
  provenance: "F2",
  removal: "D6",
  replacement: "A5",
  reset: "C9",
  "self-update": "E2",
  space: "D5",
  step: "D3",
  "stop-seeding": "D5",
  stored: "A6",
  stuck: "C7",
  substitution: "F4",
  trace: "D9",
  uninstall: "A6",
  update: "E1",
  version: "E2",
  walkthrough: "D3",
  watch: "C5",
  wiring: "D1",
  wizard: "A2",
  word: "G2",
};

/**
 * Every file under `src`, as written, by its path from the repository's root.
 *
 * Read through the bundler rather than off the disk, so the suite reads the tree
 * the build reads.
 */
const SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("./**/*.{ts,svelte}", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ).map(([path, source]) => [path.replace(/^\.\//, "src/"), source]),
);

/** One file under `src`, as written, or nothing where there is none. */
function read(path: string): string {
  return SOURCES[path] ?? "";
}

/**
 * Every kind the client names, read off the declaration it ships.
 *
 * The union is a type and leaves nothing behind at run time, so it is read where
 * the client states it rather than restated here.
 */
function everyKind(): readonly string[] {
  const union = /type Kind = ([^;]+);/.exec(declared)?.[1] ?? "";
  return [...union.matchAll(/"([^"]+)"/g)].map((kind) => kind[1] ?? "");
}

/** Where an import names a file of this repository. */
const IMPORTED = /from\s+"(\.{1,2}\/[^"]+)"/g;

/** The path one file names another by, joined to the directory it is in. */
function joined(from: string, named: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of named.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

/** The file an import names, where it is one this repository writes. */
function resolved(from: string, named: string): string | undefined {
  const at = joined(from, named);
  if (!at.startsWith("src/") || at.startsWith("src/paraglide/")) {
    return undefined;
  }
  if (at.endsWith(".svelte") || at.endsWith(".ts")) return at;
  return `${at.replace(/\.js$/, "")}.ts`;
}

/** Every file of this repository's reached by importing, starting at one. */
function reachedFrom(start: string): ReadonlySet<string> {
  const reached = new Set<string>();
  const waiting = [start];
  for (let at = waiting.pop(); at !== undefined; at = waiting.pop()) {
    if (reached.has(at)) continue;
    reached.add(at);
    for (const [, named] of read(at).matchAll(IMPORTED)) {
      const next = named === undefined ? undefined : resolved(at, named);
      if (next !== undefined) waiting.push(next);
    }
  }
  return reached;
}

/** The places a kind is read: asked for, recognised, or listened for. */
const READERS = [
  /\basked\(\s*[^,]+,\s*[^,]+,\s*"([a-z-]+)"/g,
  /\bisKind\(\s*[^,]+,\s*"([a-z-]+)"\)/g,
  /"([a-z-]+)" satisfies Kind\b/g,
];

/** Every kind something the page imports reads. */
function everyKindRead(): readonly string[] {
  const found = new Set<string>();
  for (const file of reachedFrom("src/main.ts")) {
    const source = read(file);
    for (const reader of READERS) {
      for (const [, kind] of source.matchAll(reader)) {
        if (kind !== undefined) found.add(kind);
      }
    }
  }
  return [...found];
}

/** Every entry in several lists, named. */
function named(...lists: readonly (readonly string[])[]): readonly string[] {
  return lists.flat();
}

/** What is in `these` and not in `those`. */
function without(
  these: readonly string[],
  those: readonly string[],
): readonly string[] {
  return these.filter((one) => !those.includes(one));
}

/** What appears more than once. */
function twice(all: readonly string[]): readonly string[] {
  return all.filter((one, at) => all.indexOf(one) !== at);
}

/** A number and the noun it counts, agreeing. */
function counted(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** The headings the page's six tables stand under. */
const KINDS_OFFERED = "Kinds read here";
const KINDS_ELSEWHERE = "Kinds served by no endpoint";
const KINDS_WAITING = "Kinds not read yet";
const REQUESTS_OFFERED = "Requests offered here";
const REQUESTS_ELSEWHERE = "Requests unsuited to this surface";
const REQUESTS_WAITING = "Requests not offered yet";

/** Some of the page, with every run of blank space read as one space. */
function flattened(said: string): string {
  return said.replaceAll(/\s+/g, " ");
}

/** The whole page, flattened. */
function page(): string {
  return flattened(written);
}

/** What the page says under one heading, up to the next one, flattened. */
function under(heading: string): string {
  const from = written.indexOf(`\n## ${heading}\n`);
  if (from === -1) return "";
  const to = written.indexOf("\n## ", from + 1);
  return flattened(written.slice(from, to === -1 ? undefined : to));
}

/** The rows a table under one heading holds, by the name each leads with. */
function rowsUnder(heading: string): readonly string[] {
  return [...under(heading).matchAll(/\| `([^`]+)` \|/g)].map(
    (row) => row[1] ?? "",
  );
}

const kinds = named(
  OFFERED_KINDS,
  Object.keys(THROUGH_THE_CLIENT),
  Object.keys(ELSEWHERE_KINDS),
  Object.keys(NOT_YET_KINDS),
);

const requests = named(
  OFFERED_REQUESTS,
  Object.keys(ELSEWHERE_REQUESTS),
  Object.keys(NOT_YET_REQUESTS),
);

describe("every kind the client carries", () => {
  it("reads the kinds off the client rather than finding none", () => {
    expect(everyKind().length).toBeGreaterThan(0);
  });

  it("walks from the page's entry to every screen it draws", () => {
    expect(reachedFrom("src/main.ts")).toContain(
      "src/routes/panels/Running.svelte",
    );
  });

  it("has been looked at", () => {
    expect(without(everyKind(), kinds)).toEqual([]);
  });

  it("is classified only while the client still carries it", () => {
    expect(without(kinds, everyKind())).toEqual([]);
  });

  it("is in exactly one list", () => {
    expect(twice(kinds)).toEqual([]);
  });

  it("is claimed offered only where something the page imports reads it", () => {
    expect(without(OFFERED_KINDS, everyKindRead())).toEqual([]);
  });

  it("is offered once something the page imports reads it", () => {
    expect(without(everyKindRead(), OFFERED_KINDS)).toEqual([]);
  });

  it("is read through the client only by an export this page imports", () => {
    const reached = [...reachedFrom("src/main.ts")].map(read).join("\n");
    for (const reader of Object.values(THROUGH_THE_CLIENT)) {
      expect(reached).toMatch(new RegExp(`\\b${reader}\\b[^;]*@lemonfiber`));
    }
  });
});

describe("every request another surface can make", () => {
  it("has been looked at", () => {
    expect(without(EVERY_REQUEST, requests)).toEqual([]);
  });

  it("is classified only while another surface can make it", () => {
    expect(without(requests, EVERY_REQUEST)).toEqual([]);
  });

  it("is in exactly one list", () => {
    expect(twice(requests)).toEqual([]);
  });

  it("is claimed offered only where a screen walks it", () => {
    const walked = WALKED.flatMap((one) => one.list);
    expect(without(OFFERED_REQUESTS, walked)).toEqual([]);
  });

  it("is offered once a screen walks it", () => {
    const walked = WALKED.flatMap((one) => one.list);
    expect(without(walked, OFFERED_REQUESTS)).toEqual([]);
  });

  it("is walked by a screen the console draws", () => {
    const drawn = reachedFrom("src/routes/Console.svelte");
    for (const { list, named: listed, by } of WALKED) {
      for (const screen of by) expect(drawn).toContain(screen);
      const sources = by.map(read);
      const walks = sources.some((source) =>
        new RegExp(`\\b${listed}\\b`).test(source),
      );
      for (const request of list) {
        const named = sources.some((source) => source.includes(`"${request}"`));
        expect(walks || named, request).toBe(true);
      }
    }
  });
});

describe("what is offered elsewhere", () => {
  it("names the requirement that says so, and why", () => {
    const excuses = [
      ...Object.values(ELSEWHERE_KINDS),
      ...Object.values(ELSEWHERE_REQUESTS),
    ];
    for (const because of excuses) {
      expect(because).toMatch(/^[A-Z]+\d*-R\d+ — \S/);
    }
  });
});

describe("the parity page", () => {
  it("states what these lists come to", () => {
    const said = page();
    const reads = OFFERED_KINDS.length + Object.keys(THROUGH_THE_CLIENT).length;

    expect(said).toContain(
      `The client carries ${counted(everyKind().length, "kind")} of answer, and this console reads ${String(reads)} of them.`,
    );
    expect(said).toContain(
      `Another surface can make ${counted(EVERY_REQUEST.length, "request")} of the stack, and this console offers ${String(OFFERED_REQUESTS.length)} of them.`,
    );
    expect(said).toContain(
      `${counted(Object.keys(ELSEWHERE_KINDS).length, "kind")} and ${counted(Object.keys(ELSEWHERE_REQUESTS).length, "request")} are offered elsewhere by rule, and ${counted(Object.keys(NOT_YET_KINDS).length, "kind")} and ${counted(Object.keys(NOT_YET_REQUESTS).length, "request")} are not offered yet.`,
    );
  });

  it.each([
    [KINDS_WAITING, NOT_YET_KINDS],
    [REQUESTS_WAITING, NOT_YET_REQUESTS],
  ])("names under “%s” everything waiting, and its feature", (heading, of) => {
    const said = under(heading);
    expect(rowsUnder(heading)).toEqual(Object.keys(of));
    for (const [one, feature] of Object.entries(of)) {
      expect(said).toContain(`| \`${one}\` | ${feature} |`);
    }
  });

  it.each([
    [KINDS_ELSEWHERE, ELSEWHERE_KINDS],
    [REQUESTS_ELSEWHERE, ELSEWHERE_REQUESTS],
  ])("names under “%s” everything elsewhere, and its rule", (heading, of) => {
    const said = under(heading);
    expect(rowsUnder(heading)).toEqual(Object.keys(of));
    for (const [one, because] of Object.entries(of)) {
      const [rule] = because.split(" — ");
      expect(said).toContain(`| \`${one}\` | \`${rule ?? ""}\` |`);
    }
  });

  it.each([
    [KINDS_OFFERED, [...OFFERED_KINDS, ...Object.keys(THROUGH_THE_CLIENT)]],
    [REQUESTS_OFFERED, OFFERED_REQUESTS],
  ])("names under “%s” everything offered", (heading, of) => {
    expect(rowsUnder(heading)).toEqual(of);
  });
});
