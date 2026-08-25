/**
 * One request to the running lemonfiber, made the one way a request is made.
 *
 * The two writes this surface makes — asking for an action, and asking what
 * became of one — differ in their method and in what they make of the reply,
 * and in nothing else. The address is checked the same way, the key travels in
 * the same header, and a request that never arrives is the same non-answer. So
 * that much is here, and a third write added later carries the key and refuses
 * a foreign address by having been written rather than by whoever wrote it
 * having remembered to.
 *
 * The reads do not come through here. They go through the client package, whose
 * business is the envelope and the wire version; these two are read for their
 * status before they are read for anything else, which is the one thing the
 * client's own reader has a single answer for.
 */
import {
  address,
  TOKEN_HEADER,
  unreachable,
  type Problem,
} from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";

/** What a request came back with, or why it never got there. */
export type Answered =
  | { readonly ok: true; readonly status: number; readonly said: string }
  | { readonly ok: false; readonly problem: Problem };

/** What a request carries beyond the address it is sent to. */
export interface Carrying {
  /** The method, as the endpoint answers it. */
  readonly method: string;
  /** The body, for a request that has one. */
  readonly body?: string | undefined;
}

/**
 * Whether a status says the request was answered rather than refused.
 */
export function succeeded(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Make one request, and hand back what came of it unread.
 */
export async function reached(
  reaching: Reaching,
  path: string,
  carrying: Carrying,
): Promise<Answered> {
  const where = address(reaching.at);
  if (!where.ok) return { ok: false, problem: where.problem };

  const headers: Record<string, string> = {
    [TOKEN_HEADER]: reaching.token,
    Accept: "application/json",
  };
  if (carrying.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const answer = await reaching.sending(`${where.base}${path}`, {
      method: carrying.method,
      headers,
      ...(carrying.body !== undefined && { body: carrying.body }),
    });
    return { ok: true, status: answer.status, said: await answer.text() };
  } catch {
    return { ok: false, problem: unreachable() };
  }
}
