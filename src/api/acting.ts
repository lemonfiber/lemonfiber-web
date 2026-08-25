/**
 * Telling one running lemonfiber to do something, and reading what came back.
 *
 * An action is asked for by the name the command line uses, and the arguments
 * are that command's own flags in one carrier. A field no action takes is
 * refused rather than ignored, so only the fields the actions this surface
 * offers take are ever sent.
 *
 * There are two replies and they mean different things. Work that reaches the
 * container engine is handed to the runtime and answered with a name for it,
 * and the request is over while the work goes on — a tab closed mid-repair
 * takes nothing with it. Work confined to lemonfiber's own files has finished
 * by the time a reply could be written and is answered with its outcome.
 *
 * A refusal is answered in lemonfiber's own words, either as the sentence this
 * surface says about a request it would not carry out or as the problem
 * envelope a command that failed renders. Both are carried out of here as the
 * sentence, so nothing above renders a bare status.
 */
import {
  address,
  isKind,
  malformed,
  parse,
  TOKEN_HEADER,
  unreachable,
} from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";

/** Where an action is asked for. */
const ACTIONS = "/api/actions/";

/** The status a request carrying the wrong key is turned away with. */
const TURNED_AWAY = 403;

/** The status work handed to the runtime is answered with. */
const ACCEPTED = 202;

/**
 * The arguments an action was given, mirroring the flags its command takes.
 *
 * The carrier the endpoint reads has more fields than these; what is written
 * here is what the actions this surface offers take. A field spelled wrongly is
 * refused outright rather than dropped, so nothing is sent on the chance it is
 * read.
 */
export interface Arguments {
  /** The forms to act on. Empty means the whole stack. */
  readonly forms: readonly string[];
  /** Whether a cost the action would incur was agreed to in advance. */
  readonly confirm: boolean;
}

/**
 * What became of one action.
 */
export type Acted =
  /** Handed to the runtime under this name, and still going. */
  | { readonly at: "started"; readonly job: string }
  /** Finished while the request was still open. */
  | { readonly at: "settled" }
  /** Not carried out, in the words of whoever would not carry it out. */
  | { readonly at: "declined"; readonly said: string }
  /** The key this page is using is not the one this run is expecting. */
  | { readonly at: "turned-away" };

/**
 * Ask for one action, and read what came back.
 */
export async function acting(
  reaching: Reaching,
  action: string,
  given: Arguments,
): Promise<Acted> {
  const where = address(reaching.at);
  if (!where.ok) return { at: "declined", said: where.problem.message };

  let answer;
  let said;
  try {
    answer = await reaching.sending(`${where.base}${ACTIONS}${action}`, {
      method: "POST",
      headers: {
        [TOKEN_HEADER]: reaching.token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(given),
    });
    said = await answer.text();
  } catch {
    return { at: "declined", said: unreachable().message };
  }

  if (answer.status === TURNED_AWAY) return { at: "turned-away" };
  if (!answer.ok) return { at: "declined", said: refusedIn(said) };

  const read = parse<unknown>(said);
  if (!read.ok) return { at: "declined", said: read.problem.message };
  if (answer.status !== ACCEPTED) return { at: "settled" };

  return isKind(read.value, "job")
    ? { at: "started", job: read.value.data.job }
    : { at: "declined", said: malformed().message };
}

/**
 * The sentence a refusal carried.
 *
 * A request this surface would not carry out is answered as prose, and a
 * command that ran and failed is answered as the problem envelope every other
 * endpoint renders. The envelope is tried first: its summary is the one plain
 * sentence a reader gets, and the raw document is not something to show anyone.
 * A body carrying neither leaves nothing of lemonfiber's to pass on.
 */
function refusedIn(said: string): string {
  const read = parse<unknown>(said);
  if (read.ok && isKind(read.value, "error")) return read.value.data.summary;
  return said.trim() === "" ? malformed().message : said;
}
