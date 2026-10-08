/**
 * A run that walks setup as a suite stands it in: each step answered with
 * the report the script names for it, and every request recorded.
 */
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { render } from "@testing-library/svelte";
import { vi } from "vitest";
import Setup from "../Setup.svelte";
import { stack } from "../fixture";
import type { Wizard } from "../../lib/wizard";

/** One request the run was sent. */
export interface Sent {
  readonly path: string;
  readonly method: string;
  readonly body: string | undefined;
}

/**
 * What one route answers: where setup stands, a refusal with what it said, or
 * an envelope of another kind as it is written.
 */
export type Said =
  | Wizard
  | { readonly status: number; readonly text: string }
  | { readonly envelope: string };

const here = "http://127.0.0.1:7777";

/** The body a route answers with: the stack where nothing was scripted. */
function bodyOf(said: Exclude<Said, { status: number }> | undefined): string {
  if (said === undefined) return enveloped("status", stack);
  if ("envelope" in said) return said.envelope;
  return enveloped("wizard", said);
}

/** Whether a route was scripted with one answer after another. */
function listed(
  scripted: Said | readonly Said[] | undefined,
): scripted is readonly Said[] {
  return Array.isArray(scripted);
}

/** The stream is never opened, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** An envelope of one kind. */
export const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/**
 * The setup screen over a run that answers each setup route from `script`,
 * the read of where it stands first, and any other read with the stack.
 */
export function walked(
  script: Readonly<Record<string, Said | readonly Said[]>>,
): {
  readonly sent: Sent[];
  readonly onrefused: () => void;
} {
  const sent: Sent[] = [];
  const onrefused = vi.fn();
  const asked = new Map<string, number>();
  /** One route's answer this time: the next of a list, holding at its last. */
  const next = (
    scripted: Said | readonly Said[] | undefined,
    path: string,
  ): Said | undefined => {
    if (!listed(scripted)) return scripted;
    const at = asked.get(path) ?? 0;
    asked.set(path, at + 1);
    return scripted[Math.min(at, scripted.length - 1)];
  };
  const sending: Sending = (url, init) => {
    const path = url.slice(here.length).split("?")[0] ?? "";
    sent.push({ path, method: init.method, body: init.body });
    const said = next(script[path], path);
    if (said !== undefined && "status" in said) {
      return Promise.resolve({
        ok: said.status < 300,
        status: said.status,
        text: () => Promise.resolve(said.text),
      });
    }
    const text = bodyOf(said);
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(text),
    });
  };
  render(Setup, {
    reaching: { at: here, token: "a-run-key", sending, fetching: silent },
    onrefused,
    pausing: () => Promise.resolve(),
  });
  return { sent, onrefused };
}

/** What one setup route was sent, in order. */
export const sentTo = (
  sent: readonly Sent[],
  path: string,
): readonly (string | undefined)[] =>
  sent.filter((one) => one.path === path).map((one) => one.body);
