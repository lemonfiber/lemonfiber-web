/**
 * What the household asked for, in the words this interface already has.
 *
 * Seven states, and no severity among them. Where a request stands is a stage
 * rather than a grading: nobody has said that a request turned down wants the
 * operator, or that one still waiting for approval is worse than one on its
 * way — so the word is the whole of what is shown, and a screen that tinted
 * these would be assigning a severity the server never assigned.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { Request, RequestState } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Every state a request can be in, in the order the contract declares them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyRequestState: readonly RequestState[] = [
  "waiting-for-approval",
  "declined",
  "failed",
  "getting",
  "partly-here",
  "here",
  "gone",
];

/**
 * Where it stands, in the words the person who asked would use.
 */
export function wordOfRequestState(state: RequestState): string {
  switch (state) {
    case "waiting-for-approval":
      return m.request_state_waiting_for_approval();
    case "declined":
      return m.request_state_declined();
    case "failed":
      return m.request_state_failed();
    case "getting":
      return m.request_state_getting();
    case "partly-here":
      return m.request_state_partly_here();
    case "here":
      return m.request_state_here();
    case "gone":
      return m.request_state_gone();
    default:
      return m.request_state_unrecognised();
  }
}

/**
 * Where it stands, or that the request service reported something this build
 * has no word for.
 *
 * Two ways that happens. The service may say nothing at all, which the contract
 * allows; or it may say a word added to the vocabulary since this build's
 * contract was generated, which the wire version does not tell apart. Both read
 * as the same sentence, since both are the same thing to whoever is reading.
 */
export function standingOf(request: Request): string {
  const state = request.state ?? undefined;
  return state === undefined
    ? m.request_state_unrecognised()
    : wordOfRequestState(state);
}

/**
 * What to call it.
 *
 * A request no service holds yet has no title to show: one still waiting for
 * approval has been handed to nobody, so there is nothing to have been told a
 * name by. Naming it by what it is keeps the row honest rather than inventing
 * something to call it.
 */
export function nameOfRequest(request: Request): string {
  const title = request.title ?? undefined;
  if (title !== undefined) return title;

  const media = request.media ?? undefined;
  return media === undefined
    ? m.request_unnamed()
    : m.request_a_kind({ media });
}

/**
 * The kind of thing it is, set beside the name — or nothing, where the name is
 * already the kind or the request service named one this build does not know.
 */
export function kindOfRequest(request: Request): string | undefined {
  const media = request.media ?? undefined;
  const title = request.title ?? undefined;
  return title === undefined ? undefined : media;
}
