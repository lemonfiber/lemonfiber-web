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
 * A name this run never handed out is absent rather than unfinished. Nothing
 * carries a job across a restart, so a tab reopened onto a lemonfiber that has
 * been restarted asks about work nothing is doing — and answering "still going"
 * would leave it waiting on an outcome that is never coming.
 *
 * Being unable to ask is neither of those. The work may be running perfectly
 * well; it is this page that has lost the thread, and saying the work stopped
 * would be this page's guess reported as lemonfiber's word.
 */
import { parse, refusalIn } from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";
import { reached, succeeded } from "./reached";

/** Where a name is redeemed. */
const JOBS = "/api/jobs/";

/** The status work still going is answered with. */
const STILL_GOING = 202;

/** The status a name this run never handed out is answered with. */
const NEVER_HANDED_OUT = 404;

/** How long to leave between one asking and the next. */
export const BETWEEN_ASKS = 2000;

/** Where one piece of work got to. */
export type Redeemed =
  /** Still going. Nothing more is known until it is not. */
  | { readonly at: "running" }
  /** Finished, and lemonfiber rendered what it came to. */
  | { readonly at: "finished" }
  /** Stopped, in the words of whatever stopped it. */
  | { readonly at: "stopped"; readonly said: string }
  /** No work in this run goes by that name. */
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
  const answer = await reached(reaching, `${JOBS}${encodeURIComponent(job)}`, {
    method: "GET",
  });
  if (!answer.ok) return { at: "adrift", said: answer.problem.message };

  const { status, said } = answer;
  if (status === NEVER_HANDED_OUT) return { at: "forgotten" };
  if (!succeeded(status)) {
    const problem = refusalIn(status, said);
    return problem.kind === "refused"
      ? { at: "turned-away" }
      : { at: "stopped", said: problem.message };
  }

  const read = parse<unknown>(said);
  if (!read.ok) return { at: "adrift", said: read.problem.message };
  return status === STILL_GOING ? { at: "running" } : { at: "finished" };
}
