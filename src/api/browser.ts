/**
 * The two slices of `fetch` the client asks for.
 *
 * Handed in from `main.ts` rather than reached for, so a screen and a test are
 * both given their transport instead of finding one — and the surface holds one
 * place where a request is made, which is what keeps it from growing a second.
 */
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";

/** One request, answered and closed. */
export const sending: Sending = (url, init) => fetch(url, init);

/** One request, held open. */
export const fetching: Fetching = (url, init) => fetch(url, init);
