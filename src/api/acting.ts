/**
 * Telling one running lemonfiber to do something, and reading what came back.
 *
 * An action is asked for by the name the command line uses, and the arguments
 * are that command's own flags in one carrier. A field no action takes is
 * refused rather than ignored, and so is a field the named action's command has
 * nowhere to put — dropping one would carry out a different request from the one
 * that was asked. So the body is built from what the action takes and holds
 * nothing else; which action takes what is stated in `src/lib/work.ts`.
 *
 * There are two replies and they mean different things. Work that reaches the
 * container engine is handed to the runtime and answered with a name for it,
 * and the request is over while the work goes on — a tab closed mid-repair
 * takes nothing with it. What that name is redeemed for is in `./redeeming`.
 * Work confined to lemonfiber's own files has finished by the time a reply could
 * be written and is answered with its outcome.
 *
 * A refusal is answered in lemonfiber's own words, either as the sentence this
 * surface says about a request it would not carry out or as the problem
 * envelope a command that failed renders. Both are carried out of here as the
 * sentence, so nothing above renders a bare status.
 */
import { isKind, malformed, parse } from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";
import { reached, succeeded } from "./reached";
import { saidIn } from "./said";

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
 * here is what the actions this surface offers take. Each is optional, because
 * an action whose command has no field for one is asked for without it rather
 * than with it left empty.
 */
export interface Arguments {
  /** The forms to act on. Empty means the whole stack. */
  readonly forms?: readonly string[];
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
  const answer = await reached(reaching, `${ACTIONS}${action}`, {
    method: "POST",
    body: JSON.stringify(given),
  });
  if (!answer.ok) return { at: "declined", said: answer.problem.message };

  const { status, said } = answer;
  if (status === TURNED_AWAY) return { at: "turned-away" };
  if (!succeeded(status)) return { at: "declined", said: saidIn(said) };

  const read = parse<unknown>(said);
  if (!read.ok) return { at: "declined", said: read.problem.message };
  if (status !== ACCEPTED) return { at: "settled" };

  return isKind(read.value, "job")
    ? { at: "started", job: read.value.data.job }
    : { at: "declined", said: malformed().message };
}
