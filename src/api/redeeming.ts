/**
 * Redeeming the name work outliving a request was answered with.
 *
 * An action reaching the container engine is not waited for: the reply is a
 * name, and the work goes on where the request cannot reach it. The name is
 * only an answer because it can be handed back, and this is the handing back.
 *
 * The status is what says where the work got to, so the reply is read for its
 * status before it is read for anything else — which is why this is here rather
 * than through the client's own reader, whose business is the envelope and
 * which has one answer for every status that is not a plain success.
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
import type { Reaching } from "./asking";
import { reached, succeeded } from "./reached";
import { saidIn } from "./said";

/** Where a name is redeemed. */
const JOBS = "/api/jobs/";

/** The status a request carrying the wrong key is turned away with. */
const TURNED_AWAY = 403;

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
  if (status === TURNED_AWAY) return { at: "turned-away" };
  if (status === NEVER_HANDED_OUT) return { at: "forgotten" };
  if (status === STILL_GOING) return { at: "running" };
  if (!succeeded(status)) return { at: "stopped", said: saidIn(said) };
  return { at: "finished" };
}
