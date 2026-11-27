/**
 * `docs/surface-parity.md` held to the lists the console's offer is measured
 * by: every figure it states, every row it names, and what it says of an
 * action, of what waits on lemonfiber and of what only the command line takes.
 */
/// <reference types="vite/client" />
import {
  ACTIONS,
  isActionName,
  type ActionDescribed,
  type ActionName,
} from "@lemonfiber/sdk-ts";
import written from "../docs/surface-parity.md?raw";
import {
  ELSEWHERE_KINDS,
  NOT_YET_KINDS,
  OFFERED_KINDS,
  THROUGH_THE_CLIENT,
  UNSERVED_KINDS,
} from "./offered-kinds.testing";
import {
  ELSEWHERE_REQUESTS,
  EVERY_REQUEST,
  NOT_YET_REQUESTS,
  OFFERED_REQUESTS,
} from "./offered-requests.testing";
import { among, everyKind } from "./offered.testing";

/**
 * What the page may say of an action, each held to what the contract says of
 * it: a phrase, and what must be true of every action named beside it.
 */
const SAID_OF_ACTIONS: readonly {
  readonly phrase: string;
  readonly holds: (action: ActionDescribed) => boolean;
}[] = [
  { phrase: "takes no rehearsal", holds: (action) => !action.rehearsal },
  {
    phrase: "takes a bare yes",
    holds: (action) => action.consent.length === 0,
  },
];

/** What a row of the page says lemonfiber takes from no surface but the command line. */
const COMMAND_LINE_ONLY = "lemonfiber takes it at the command line only";

/**
 * The page as the units a claim is made in: each table row, and each sentence
 * of the prose between them.
 */
function claims(): readonly string[] {
  const units: string[] = [];
  for (const block of written.split(/\n\s*\n/)) {
    if (block.trimStart().startsWith("|")) {
      units.push(...block.split("\n").map(flattened));
    } else {
      units.push(...flattened(block).split(/(?<=\.)\s+/));
    }
  }
  return units;
}

/** Every action named in a unit of the page, as the page writes a name. */
function actionsNamed(unit: string): readonly ActionName[] {
  return [...unit.matchAll(/`([a-z-]+)`/g)]
    .map((one) => one[1] ?? "")
    .filter((name) => isActionName(name));
}

/** A number and the noun it counts, agreeing. */
function counted(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** Names as a sentence offers a choice of them: `a`, `b` or `c`. */
function either(names: readonly string[]): string {
  const quoted = names.map((name) => `\`${name}\``);
  return `${quoted.slice(0, -1).join(", ")} or ${quoted.slice(-1).join("")}`;
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

/** What a waiting row says lemonfiber does not serve. */
const UNSERVED = "lemonfiber serves no endpoint";

/** The rows of a table under one heading whose last column says something. */
function rowsSaying(heading: string, said: string): readonly string[] {
  return [...under(heading).matchAll(/\| `([^`]+)` \| [^|]* \| ([^|]*) \|/g)]
    .filter((row) => (row[2] ?? "").includes(said))
    .map((row) => row[1] ?? "");
}

/** The rows a table under one heading holds, by the name each leads with. */
function rowsUnder(heading: string): readonly string[] {
  return [...under(heading).matchAll(/\| `([^`]+)` \|/g)].map(
    (row) => row[1] ?? "",
  );
}

describe("the parity page", () => {
  it("is read as rows and sentences, so a claim is found where it is made", () => {
    expect(claims()).toContain("Four of these are offered in part.");
    expect(actionsNamed("`remove` and `ui` and `quality-set`")).toEqual([
      "remove",
      "quality-set",
    ]);
  });

  it.each(SAID_OF_ACTIONS)(
    "says “$phrase” only of an action the contract says it of",
    ({ phrase, holds }) => {
      for (const unit of claims().filter((one) => one.includes(phrase))) {
        for (const name of actionsNamed(unit)) {
          expect(holds(ACTIONS[name]), `${name}: ${unit}`).toBe(true);
        }
      }
    },
  );

  it("says lemonfiber takes a request at the command line only of no action", () => {
    const rows = rowsSaying(REQUESTS_WAITING, COMMAND_LINE_ONLY);
    expect(rows.length).toBeGreaterThan(0);
    expect(among(rows, Object.keys(ACTIONS))).toEqual([]);
  });

  it("says lemonfiber serves no endpoint only of what waits on it", () => {
    expect(rowsSaying(KINDS_WAITING, UNSERVED)).toEqual(UNSERVED_KINDS);
    expect(page()).toContain(
      `No endpoint answers with ${either(UNSERVED_KINDS)}, so these wait on lemonfiber rather than on this surface.`,
    );
  });

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
