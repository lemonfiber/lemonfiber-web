/**
 * The bodies a suite stands in for a running lemonfiber.
 *
 * Every suite beside this one hands a hand-written body to a reader, and a
 * hand-written body is written by whoever wrote the reader. Where the two agree
 * about a field that is not there they are wrong in the same direction and the
 * suite is green. That is the one failure a contract test cannot survive: it is
 * the only thing standing between a reader and a machine nobody has run it
 * against.
 *
 * So a body standing in for a stack is declared as the payload the kind it names
 * carries, and the compiler asks the three questions in both directions: a key
 * the contract has not got at that path, a key it requires that the body leaves
 * out, and a word outside a closed set it declares. The generated types are what
 * know the answers, so nothing here is a second statement of the contract.
 *
 * A body that exists to be refused is the other function, and it says so in its
 * own name. Declaring one loosely reads exactly like having forgotten to declare
 * one at all, and the two must not look alike.
 *
 * Here rather than in each suite because the reading each of them is about is
 * the same reading, and four copies of what an envelope looks like is four
 * places for one to stop looking like it.
 */
import { API_VERSION, type ByKind, type Kind } from "@lemonfiber/sdk-ts";

/** One envelope, rendered as the server renders it. */
export function enveloped<K extends Kind>(
  kind: K,
  data: ByKind[K]["data"],
): string {
  return JSON.stringify({ api_version: API_VERSION, kind, data });
}

/** A body no lemonfiber sends, for the readings whose subject is refusing one. */
export function notFromLemonfiber(kind: string, data: unknown): string {
  return JSON.stringify({ api_version: API_VERSION, kind, data });
}

/** One refusal, as a command that ran and failed renders it. */
export function failure(summary: string): ByKind["error"]["data"] {
  return {
    code: "engine-absent",
    summary,
    meaning: "Nothing can be started until it is.",
    remedies: [],
    severity: "error",
    state: "actionable",
  };
}

/** One reply, as a transport hands it over. */
export function replying(
  status: number,
  body: string,
): { ok: boolean; status: number; text: () => Promise<string> } {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  };
}

/** What a reverse proxy in front of lemonfiber answers with when it cannot. */
export const proxyPage = [
  "<html>",
  "<head><title>502 Bad Gateway</title></head>",
  "<body><center><h1>502 Bad Gateway</h1></center></body>",
  "</html>",
].join("\n");
