/**
 * What the console's suites open it against: transports that answer its readings
 * and its actions, streams that carry or refuse what they were given, and the
 * console opened over them.
 */
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import {
  API_VERSION,
  type ByKind,
  type Fetching,
  type Kind,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { vi } from "vitest";
import Console from "./Console.svelte";
import { declared, forms, job, rehearsed, stack } from "./fixture";
import * as m from "../paraglide/messages.js";
import { key, here, enveloped, type Says } from "./served";

/**
 * What the forms read answers: every form where none is named, and what starting
 * the ones named would come to where some are.
 */
export const formsSaid = (url: string): string => {
  const named = new URL(url).searchParams.getAll("form");
  return named.length > 0
    ? enveloped("preview", { ...rehearsed, forms: named })
    : enveloped("forms", forms);
};

/** A transport that answers each reading with what that endpoint answers. */
export const answering: Sending = (url) =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        url.includes("/api/forms")
          ? formsSaid(url)
          : enveloped("status", stack),
      ),
  });

/** A transport that refuses the key this page is using. */
export const refusing: Sending = () =>
  Promise.resolve({
    ok: false,
    status: 401,
    text: () => Promise.resolve(""),
  });

/** One event, framed as the stream frames it. */
export const framed = <K extends Kind>(
  kind: K,
  data: ByKind[K]["data"],
): string =>
  `event: ${kind}\ndata: ${JSON.stringify({ api_version: API_VERSION, kind, data })}\n\n`;

/**
 * A stream that hands over one opening and will not open again.
 *
 * Refusing the second opening is what makes a test end: following reopens a
 * broken stream several times before it gives up.
 */
export function saying(said: readonly string[]): Fetching {
  let opened = false;
  return () => {
    if (opened) return Promise.resolve({ ok: false, status: 500, body: null });
    opened = true;
    return Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const bytes = new TextEncoder();
          for (const one of said) controller.enqueue(bytes.encode(one));
          controller.close();
        },
      }),
    });
  };
}

/** A stream that will not open at all. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** Lets whatever was queued for the next task run. */
export const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** A wait that never ends, which parks the asking where a test wants it. */
const parked = (): Promise<void> => new Promise(() => undefined);

export const console_ = (
  over: {
    sending?: Sending;
    fetching?: Fetching;
    at?: string;
    onrefused?: () => void;
    pausing?: () => Promise<void>;
  } = {},
): { unmount: () => void } => {
  const { unmount } = render(Console, {
    reaching: {
      at: over.at ?? here,
      token: key,
      sending: over.sending ?? answering,
      fetching: over.fetching ?? silent,
    },
    onrefused: over.onrefused ?? vi.fn(),
    pausing: over.pausing ?? parked,
  });
  return { unmount };
};

/** What was asked of the write endpoints, in the order it was asked. */
export interface Sent {
  /** The bodies the action endpoint was posted. */
  bodies: string[];
  /** The addresses a name was redeemed at. */
  redeemed: string[];
}

/** Work the runtime took, as the action endpoint answers it. */
export const accepted: Says = {
  status: 202,
  body: enveloped("job", { job, action: "up" }),
};

/** The work, finished, as the equivalent command renders it. */
export const rendered: Says = {
  status: 200,
  body: enveloped("lifecycle", {
    action: "up",
    command: ["compose", "up", "-d"],
    plan: {
      dropped: [],
      filtered: [],
      footprint: { estimated_mib: 64, unestimated: [] },
      forms: ["core"],
      profiles: ["core"],
      services: ["gluetun"],
    },
    rehearsed: false,
    services: [],
    stack_edits: [],
    condition: "active",
  }),
};

/** The work, still going, as asking about it answers. */
export const going: Says = accepted;

/**
 * A transport that reads like the stack, answers every action alike, and says
 * what became of the work each time it is asked.
 *
 * The reply to an action is fixed rather than looked up per action: what a test
 * is asking about is what the screen does with a reply rather than which reply
 * a name earns. What became of the work is a list, read one entry per asking and
 * holding at the last, so a test says how many times it has to be asked before
 * there is something to say.
 */
export function acting(
  reply: Says,
  sent: Sent = { bodies: [], redeemed: [] },
  becoming: readonly Says[] = [rendered],
): Sending {
  let asked = 0;
  return (url, init) => {
    if (init.method === "POST") {
      sent.bodies.push(init.body ?? "");
      return Promise.resolve({
        ok: reply.status >= 200 && reply.status < 300,
        status: reply.status,
        text: () => Promise.resolve(reply.body),
      });
    }
    if (!url.includes("/api/jobs/")) return answering(url, init);

    sent.redeemed.push(url);
    const said = becoming[Math.min(asked, becoming.length - 1)] ?? going;
    asked += 1;
    return Promise.resolve({
      ok: said.status >= 200 && said.status < 300,
      status: said.status,
      text: () => Promise.resolve(said.body),
    });
  };
}

export const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

/** Takes one form up, by the name its control is announced under. */
export const choose = (id: string): Promise<void> => {
  const form = declared.find((one) => one.id === id);
  return press(m.forms_choose({ name: form?.name ?? "" }));
};
