/**
 * Redeeming the name work outliving a request was answered with.
 *
 * An action reaching the container engine is not waited for: the reply is a
 * name, and the work goes on where the request cannot reach it. The name is
 * only an answer because it can be handed back, and this is the handing back.
 *
 * The status is what says where the work got to, so the reply is read for its
 * status before it is read for anything else — which is why this is here rather
 * than through the client's own reader, which has one answer for every status
 * that is not a plain success. What each status that is not a success means is
 * still the client's: a body that did not come from lemonfiber is reported as
 * not answering rather than handed on as lemonfiber's words, and the key is the
 * one refusal read from the status alone. So is the envelope: a reply this page
 * counts as an outcome is read for the wire version it was written under, since
 * a document from a lemonfiber speaking another version is not an outcome this
 * page can stand behind.
 *
 * A name lemonfiber does not answer this page about is absent rather than
 * unfinished, and absent is not failed: lemonfiber answers alike for a name
 * this run never issued, one forgotten, and one whose work another credential
 * started. Nothing carries a job across a restart, so a tab reopened onto a
 * lemonfiber that has been restarted asks about work nothing is doing — and
 * answering "still going" would leave it waiting on an outcome that is never
 * coming.
 *
 * Being unable to ask is neither of those. The work may be running perfectly
 * well; it is this page that has lost the thread, and saying the work stopped
 * would be this page's guess reported as lemonfiber's word.
 *
 * Work can also end before it finishes: its name released, the work let go for
 * want of anybody asking about it, or the services it followed gone quiet. That
 * is none of finished, stopped or still going, and is read as itself.
 *
 * Forgetting a name lets it go and leaves its work running, which is what
 * putting away the record of work still running asks for. Nothing here
 * releases a name: releasing ends the work.
 */
import { isKind, parse, refusalIn, type ByKind } from "@lemonfiber/sdk-ts";
import type { Came } from "../lib/came";
import { opened, type Reaching } from "./asking";
import { outcomeOf } from "./outcome";
import { READING, reached, succeeded } from "./reached";

/** Where a name is redeemed. */
const JOBS = "/api/jobs/";

/** The status work still going is answered with. */
const STILL_GOING = 202;

/** The status a name this page may not ask about is answered with. */
const NOT_HERE = 404;

/** How long to leave between one asking and the next. */
export const BETWEEN_ASKS = 2000;

/** Why work ended before it finished, as lemonfiber said. */
export type Ending = ByKind["ended"]["data"]["ended"];

/** Where one piece of work got to. */
export type Redeemed =
  /** Still going. Nothing more is known until it is not. */
  | { readonly at: "running" }
  /** Finished, and lemonfiber rendered what it came to. */
  | { readonly at: "finished"; readonly came: Came }
  /** Stopped, in the words of whatever stopped it. */
  | { readonly at: "stopped"; readonly said: string }
  /** Ended before it finished, for the reason lemonfiber gave. */
  | { readonly at: "ended"; readonly ending: Ending }
  /** lemonfiber answers nothing about that name to this page. */
  | { readonly at: "forgotten" }
  /** It could not be asked at all, for the reason given. */
  | { readonly at: "adrift"; readonly said: string }
  /** The key this page is using is not the one this run is expecting. */
  | { readonly at: "turned-away" };

/** Waiting, handed in so a test answers at once rather than in its own time. */
export type Pausing = (ms: number) => Promise<void>;

/**
 * Wait, so asking again is a pace rather than a hammering.
 */
export const pausing: Pausing = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Ask what became of one name, and read what came back.
 */
export async function redeeming(
  reaching: Reaching,
  job: string,
): Promise<Redeemed> {
  const answer = await reached(
    reaching,
    `${JOBS}${encodeURIComponent(job)}`,
    READING,
  );
  if (!answer.ok) return { at: "adrift", said: answer.problem.message };

  const { status, said } = answer;
  if (status === NOT_HERE) return { at: "forgotten" };
  if (!succeeded(status)) {
    const problem = refusalIn(status, said);
    return problem.kind === "refused"
      ? { at: "turned-away" }
      : { at: "stopped", said: problem.message };
  }

  const read = parse(said);
  if (!read.ok) return { at: "adrift", said: read.problem.message };
  if (status === STILL_GOING) return { at: "running" };
  return isKind(read.value, "ended")
    ? { at: "ended", ending: read.value.data.ended }
    : { at: "finished", came: outcomeOf(read.value) };
}

/**
 * What forgetting a name came to: let go, which is also what a name this page
 * may no longer ask about comes to; the key turned away; or no answer.
 */
export type Forgot = "let-go" | "turned-away" | "unanswered";

/**
 * Let one name go and leave the work it names running.
 */
export async function forgetting(
  reaching: Reaching,
  job: string,
): Promise<Forgot> {
  const client = opened(reaching);
  if (!client.ok) return "unanswered";
  const forgot = await client.value.jobs.forget(job);
  if (forgot.ok || forgot.problem.kind === "missing") return "let-go";
  return forgot.problem.kind === "refused" ? "turned-away" : "unanswered";
}
