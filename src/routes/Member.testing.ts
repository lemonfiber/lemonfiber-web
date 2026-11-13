/**
 * What the household view's suites open it with: the session a member signed
 * in with, the address it is served at, and the view opened over a transport.
 */
import { render } from "@testing-library/svelte";
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { vi } from "vitest";
import Member from "./Member.svelte";
import { kitsId } from "./mine";

/** Built rather than written, so no scanner reads it as a real one. */
export const session = ["a", "session", "secret"].join("-");
export const here = "http://127.0.0.1:7777";

/** What lemonfiber says to a session that no longer stands. */
export const nobody =
  "This request carried no token or session this run admits.";

/** One reply, or a request that never arrives. */
export type Said = { status: number; body: string } | "nothing";

/** The stream is refused a member, and nothing here opens it. */
export const fetching: Fetching = vi.fn(() =>
  Promise.resolve({ ok: false, status: 500, body: null }),
);

/** The household view, opened for Kit over `sending`. */
export function signedIn(sending: Sending): {
  onrefused: ReturnType<typeof vi.fn>;
} {
  const onrefused = vi.fn();
  render(Member, {
    reaching: { at: here, token: session, sending, fetching },
    member: kitsId,
    onrefused,
  });
  return { onrefused };
}
