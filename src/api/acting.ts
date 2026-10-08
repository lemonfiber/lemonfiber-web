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
 * A reply that was not a success is read by the client package. Which status
 * carries which reading is written there once, and a body that opens as markup
 * or as a document it cannot read came from whatever stands between this page
 * and lemonfiber rather than from lemonfiber — so it is reported as not
 * answering rather than handed on as lemonfiber's words. The key is the one
 * refusal read from the status alone; every other reading carries a sentence,
 * so nothing above renders a bare status.
 */
import { isKind, malformed, parse, refusalIn } from "@lemonfiber/sdk-ts";
import type { Came } from "../lib/came";
import type { Reaching } from "./asking";
import { outcomeOf } from "./outcome";
import { reached, succeeded } from "./reached";

/** Where an action is asked for. */
const ACTIONS = "/api/actions/";

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
  /** Whether the checks that disturb a running stack are included. */
  readonly disruptive?: boolean;
  /** Whether what the action costs was agreed to. */
  readonly confirm?: boolean;
  /** The offer the agreement was read in, as it named itself. */
  readonly offer?: string;
  /** The repairs agreed to, as that offer names them. */
  readonly agreed?: readonly string[];
  /** The check a warning is being answered for. */
  readonly check?: string;
  /** The backup to restore from, by the name it was written under. */
  readonly archive?: string;
  /** Whether re-pointing to this machine's data location was accepted. */
  readonly repoint?: boolean;
  /** Whether to write the bundle, rather than say what one would hold. */
  readonly write?: boolean;
  /** How many log lines to take from each service. */
  readonly logs?: number;
  /** Whether media filenames are shown rather than replaced. */
  readonly filenames?: boolean;
  /** The setting to change, by its name. */
  readonly key?: string;
  /** The value to give it. */
  readonly value?: string;
  /** Whether anything still coming down is let finish first. */
  readonly wait?: boolean;
  /** The person acted on, by the name they sign in as. */
  readonly name?: string;
  /** The highest age rating an account may watch. */
  readonly age_limit?: number;
  /** Whether what has no rating is held back (`block`) or let through (`allow`). */
  readonly unrated?: "block" | "allow";
  /** What happens to what is asked for. */
  readonly policy?: string;
  /** How many requests a period allows. */
  readonly requests?: number;
  /** How many days a period lasts. */
  readonly days?: number;
  /** The request ruled on, by its number. */
  readonly request?: number;
  /** Why a request is turned down, for the person who asked. */
  readonly reason?: string;
  /** How much of the line downloads may take, as it was typed. */
  readonly down?: string;
  /** How much of it uploads may take, as it was typed. */
  readonly up?: string;
  /** The hours the household is awake, as `HH:MM-HH:MM`. */
  readonly active?: string;
  /** What the line carries, as `<down>/<up>`. */
  readonly line?: string;
  /** A monthly allowance for what the stack itself moves. */
  readonly cap?: string;
  /** What happens when that cap is reached. */
  readonly exceeded?: string;
  /** How many minutes to lift the limits for. */
  readonly unrestricted_for?: number;
  /** The one thing to walk through, as a person would name it. */
  readonly item?: string;
  /** The item to follow, as a person would name it. */
  readonly term?: string;
  /** The season to narrow a search to. */
  readonly season?: number;
  /** The long-running command to keep running, or stop keeping, by its name. */
  readonly kept?: string;
  /** Which of the four removals, by its name. */
  readonly tier?: string;
  /** The completed download to let go, by the name the client gives it. */
  readonly download?: string;
  /** The capability whose filler is being chosen. */
  readonly capability?: string;
  /** The service chosen to fill it. */
  readonly service?: string;
  /** Whether to say what would happen and write nothing. */
  readonly dry_run?: boolean;
}

/**
 * What became of one action.
 */
export type Acted =
  /** Handed to the runtime under this name, and still going. */
  | { readonly at: "started"; readonly job: string }
  /** Finished while the request was still open. */
  | { readonly at: "settled"; readonly came: Came }
  /** Not carried out, and why, in lemonfiber's words where it wrote any. */
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
  if (!succeeded(status)) {
    const problem = refusalIn(status, said);
    return problem.kind === "refused"
      ? { at: "turned-away" }
      : { at: "declined", said: problem.message };
  }

  const read = parse(said);
  if (!read.ok) return { at: "declined", said: read.problem.message };
  if (status !== ACCEPTED)
    return { at: "settled", came: outcomeOf(read.value) };

  return isKind(read.value, "job")
    ? { at: "started", job: read.value.data.job }
    : { at: "declined", said: malformed().message };
}
