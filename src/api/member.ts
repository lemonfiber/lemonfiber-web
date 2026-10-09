/**
 * What a household member asks lemonfiber, and what comes back.
 *
 * lemonfiber refuses a member's read for one of several reasons, and the code it
 * refuses with says which. Two leave the session standing: this is not something
 * this account may ask for, and this account could not be checked with the media
 * server. Those are drawn where the page was, in lemonfiber's words, and asking
 * again is the way on. Every other refusal of who is asking — the session is no
 * longer admitted, or the page reached lemonfiber somewhere it is not listening —
 * puts the page away and sends the member back to the door.
 *
 * A refusal carrying no code this page knows is read as the session no longer
 * standing, keeping lemonfiber's sentence where the body is one.
 *
 * Everything else about a read is the client package's: the address it checked,
 * the header the key travels in, the envelope and its wire version, and what a
 * status that is neither a success nor a refusal means.
 */
import {
  Client,
  isKind,
  malformed,
  parse,
  REFUSAL_CODES,
  refusalIn,
  type ByKind,
  type Kind,
  type Problem,
  type RefusalCode,
} from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";
import { reached, succeeded } from "./reached";

/** Who is in the household and what each asked for, narrowed to the one asking. */
export const REQUESTS = "/api/requests";

/** What one member can watch. */
const HELD = "/api/held";

/** What one member was part-way through. */
const WATCHING = "/api/watching";

/** A picture of a title on the shelf: its poster, or the wide one behind it. */
export type Artwork = "poster" | "backdrop";

/**
 * Where a title's picture is read, under this page's own `/api/`.
 *
 * lemonfiber serves a member's artwork from the console's address rather than
 * from the media server's door, so the page asks nothing of another origin and
 * the browser need not trust the door's certificate. It answers the member's
 * own shelf only, and nothing where a title has no picture. Like the title it
 * belongs to, it is read as the member the door named, since a read naming
 * nobody is refused.
 */
export function artworkAt(
  member: string,
  id: string,
  picture: Artwork,
): string {
  const whose = new URLSearchParams({ member }).toString();
  return `held/${encodeURIComponent(id)}/${picture}?${whose}`;
}

/** What a picture is served as: an image, and nothing else is drawn. */
const IMAGE = "image/";

/**
 * One title's picture, asked for with this session's key as every read is, or
 * nothing where it could not be had: no picture, a title not on this member's
 * shelf, a refusal, or an answer that is not an image.
 */
export async function takingArtwork(
  reaching: Reaching,
  member: string,
  id: string,
  picture: Artwork,
): Promise<Blob | undefined> {
  const opened = Client.at({
    url: reaching.at,
    token: reaching.token,
    sending: reaching.sending,
  });
  if (!opened.ok) return undefined;
  const handed = await opened.client.take(artworkAt(member, id, picture));
  return handed.ok && handed.value.type.startsWith(IMAGE)
    ? handed.value
    : undefined;
}

/** The statuses lemonfiber, or a proxy in front of it, turns a request away with. */
const TURNED_AWAY: ReadonlySet<number> = new Set([401, 403]);

/** What opens a document rather than a sentence. */
const OPENS_A_STRUCTURE = /^[<[{]/;

/**
 * The refusals that leave the session standing, by the names the contract lists
 * their codes under.
 *
 * By name rather than by code, so no code is written here: the contract's own
 * list says which code each name is. A refusal named anything else puts the page
 * away, which is the safe direction for one this page has not been told about.
 */
const LEAVES_THE_SESSION: ReadonlySet<string> = new Set([
  "NOT_YOURS",
  "UNCONFIRMED",
]);

/** What one read came to. */
export type Answer<T> =
  /** Answered, with the payload the kind it named carries. */
  | { readonly at: "answered"; readonly value: T }
  /**
   * Turned away, with what lemonfiber said, where it said a sentence. Nothing
   * where the body held none, which a proxy in front of it may answer with.
   */
  | { readonly at: "refused"; readonly said: string | undefined }
  /**
   * Refused, and the session still stands: what was asked is not this member's,
   * or the media server could not say who they are. lemonfiber's own sentence.
   */
  | { readonly at: "declined"; readonly said: string }
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
 * Where what that member was part-way through is read, most recent first.
 *
 * As with the shelf, lemonfiber decides whose it is from the session, and the
 * member the door named is named back to it.
 */
export function watchingOf(member: string): string {
  return `${WATCHING}?${new URLSearchParams({ member }).toString()}`;
}

/**
 * Where one title on that member's shelf is read: what it is, and a series'
 * seasons and episodes.
 *
 * The identifier is escaped, so it stays one segment of the path whatever it
 * holds. lemonfiber answers the member's own shelf only.
 */
export function titleOf(member: string, id: string): string {
  return `${HELD}/${encodeURIComponent(id)}?${new URLSearchParams({ member }).toString()}`;
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
    return turnedAway(answer.status, answer.said);
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

  const read = parse(came.value);
  if (!read.ok) return { at: "unanswered", problem: read.problem };
  if (!isKind(read.value, kind))
    return { at: "unanswered", problem: malformed() };

  return { at: "answered", value: read.value.data };
}

/**
 * What a refusal of who is asking comes to: declined where the session still
 * stands, and refused where it does not.
 *
 * The client package reads the code. A code it lists comes back declined with
 * lemonfiber's sentence; the one that is the key, and a refusal with no code it
 * lists, comes back refused, and then the sentence is whatever the body says
 * where the body is a sentence.
 */
function turnedAway(status: number, body: string): Answer<never> {
  const problem = refusalIn(status, body);
  if (problem.kind !== "declined") {
    return { at: "refused", said: sentenceIn(body) };
  }
  return leavesTheSession(problem.code)
    ? { at: "declined", said: problem.message }
    : { at: "refused", said: problem.message };
}

/** Whether a refusal with this code leaves the session standing. */
function leavesTheSession(code: RefusalCode | undefined): boolean {
  return code !== undefined && LEAVES_THE_SESSION.has(REFUSAL_CODES[code].name);
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
