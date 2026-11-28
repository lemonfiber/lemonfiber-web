/**
 * A run whose key routes answer as told, for the suites that keep keys through
 * the panel's own state.
 */
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { vi } from "vitest";
import { Keying } from "./keying.svelte";
import { here, key } from "./served";

/** The stream is never opened here, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** One request sent: its method and address, and its body. */
export interface Sent {
  readonly asked: string;
  readonly body: string | undefined;
}

/** A run whose key routes answer as told, by method and address, noting what was sent. */
export function keeping(
  answers: Partial<Record<string, { status: number; body: string }>>,
  sent: Sent[],
): { keying: Keying; onrefused: ReturnType<typeof vi.fn> } {
  const sending: Sending = (url, init) => {
    const asked = `${init.method} ${url.replace(here, "")}`;
    sent.push({ asked, body: init.body });
    const answer = answers[asked] ?? { status: 404, body: "" };
    return Promise.resolve({
      ok: answer.status < 400,
      status: answer.status,
      text: () => Promise.resolve(answer.body),
    });
  };
  const onrefused = vi.fn();
  const keying = new Keying({
    reaching: () => ({ at: here, token: key, sending, fetching: silent }),
    onrefused,
  });
  return { keying, onrefused };
}
