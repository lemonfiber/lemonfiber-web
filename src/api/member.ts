/**
 * What a household member asks lemonfiber, and what comes back.
 *
 * lemonfiber answers a member's refusal in words that say which of three things
 * it is — this is not something this account may ask for, this carried nothing
 * this run admits, or this account could not be checked with the media server —
 * and all three arrive under the same status. The client package reads every
 * refusal under that status as the one about the key and keeps none of the
 * words, which is the right reading for the operator's console and loses the
 * whole of what a member is owed. So a member's reads keep the sentence, and the
 * screen shows it as lemonfiber said it.
 *
 * Everything else about a read is the client package's: the address it checked,
 * the header the key travels in, the envelope and its wire version, and what a
 * status that is neither a success nor a refusal means.
 */
import {
  isKind,
  malformed,
  parse,
  refusalIn,
  type ByKind,
  type Kind,
  type Problem,
} from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";
import { reached, succeeded } from "./reached";

/** Who is in the household and what each asked for, narrowed to the one asking. */
export const REQUESTS = "/api/requests";

/** What one member can watch. */
const HELD = "/api/held";

/** The statuses lemonfiber, or a proxy in front of it, turns a request away with. */
const TURNED_AWAY: ReadonlySet<number> = new Set([401, 403]);

/** What opens a document rather than a sentence. */
const OPENS_A_STRUCTURE = /^[<[{]/;

/** What one read came to. */
export type Answer<T> =
  /** Answered, with the payload the kind it named carries. */
  | { readonly at: "answered"; readonly value: T }
  /**
   * Turned away, with what lemonfiber said, where it said a sentence. Nothing
   * where the body held none, which a proxy in front of it may answer with.
   */
  | { readonly at: "refused"; readonly said: string | undefined }
  /** Not answered, and why, in the client package's words. */
  | { readonly at: "unanswered"; readonly problem: Problem };

/** What one read came to, where being turned away is not among the answers. */
export type Heard<T> = Exclude<Answer<T>, { at: "refused" }>;

/**
 * Where the shelf of the member this session is for is read.
 *
 * Whose shelf it is is lemonfiber's to decide and it decides it from the session
 * rather than from this, but the read refuses a request naming nobody, so the
 * member the door named is named back to it.
 */
export function shelfOf(member: string): string {
  return `${HELD}?${new URLSearchParams({ member }).toString()}`;
}

/**
 * Ask for one address, and read no further than whether it was answered.
 */
export async function knocked(
  reaching: Reaching,
  path: string,
): Promise<Answer<string>> {
  const answer = await reached(reaching, path, { method: "GET" });
  if (!answer.ok) return { at: "unanswered", problem: answer.problem };
  if (TURNED_AWAY.has(answer.status))
    return { at: "refused", said: sentenceIn(answer.said) };
  if (!succeeded(answer.status)) {
    return {
      at: "unanswered",
      problem: refusalIn(answer.status, answer.said),
    };
  }
  return { at: "answered", value: answer.said };
}

/**
 * Ask for one read, narrowed to the payload the kind it names carries.
 */
export async function heard<K extends Kind>(
  reaching: Reaching,
  path: string,
  kind: K,
): Promise<Answer<ByKind[K]["data"]>> {
  const came = await knocked(reaching, path);
  if (came.at !== "answered") return came;

  const read = parse<unknown>(came.value);
  if (!read.ok) return { at: "unanswered", problem: read.problem };
  if (!isKind(read.value, kind))
    return { at: "unanswered", problem: malformed() };

  return { at: "answered", value: read.value.data };
}

/**
 * The sentence a refusal carried, or nothing where its body holds none.
 *
 * lemonfiber refuses in prose. A page or a document is what something standing
 * in front of it answers with, and is not handed on as lemonfiber's words.
 */
function sentenceIn(body: string): string | undefined {
  const words = body.trim();
  return words === "" || OPENS_A_STRUCTURE.test(words) ? undefined : words;
}
