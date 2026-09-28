/**
 * A stack the console is opened against in its suites, answering as each suite
 * tells it to. Opening the console itself stays in each suite, which is what
 * leans on the tools that only tests carry.
 *
 * Each action is answered with the next of the replies it was told, and with a
 * name for the work where it was told none. Each name is redeemed for the next
 * of what the work becomes, holding at the last. Each reading answers with what
 * it was told, found by the start of its address, and anything else is not
 * found. Everything posted and read is noted, so a suite can say what was sent.
 */
import {
  API_VERSION,
  type ByKind,
  type Kind,
  type Sending,
} from "@lemonfiber/sdk-ts";

/** Where the stack answers. */
export const here = "http://127.0.0.1:7777";

/** The key the console holds for it. */
export const key = ["a", "run", "key"].join("-");

/** One envelope, rendered as an endpoint renders it. */
export const enveloped = <K extends Kind>(
  kind: K,
  data: ByKind[K]["data"],
): string => JSON.stringify({ api_version: API_VERSION, kind, data });

/** One reply, as a transport hands it over. */
export interface Says {
  readonly status: number;
  readonly body: string;
}

/** The name for work handed to the runtime, as every job is answered. */
export const started: Says = {
  status: 202,
  body: enveloped("job", { job: "5c63e1ab7d0e9f24", action: "x" }),
};

/** What a stack is told to answer with. */
export interface Told {
  /** Each action's replies, by the action's name, in the order given. */
  readonly acting: Partial<Record<string, readonly Says[]>>;
  /** What the work becomes each time its name is redeemed, in order. */
  readonly becoming: readonly Says[];
  /** What each reading answers with, by the start of its address. */
  readonly reading: Readonly<Record<string, Says>>;
}

/** What was asked of a stack, in the order it was asked. */
export interface Asked {
  /** Each action, by the address it was posted to and what it carried. */
  readonly posted: {
    readonly at: string;
    readonly body: string | undefined;
  }[];
  /** Each reading, by the start of the address it was answered at. */
  readonly read: string[];
}

/** Nothing asked yet. */
export const fresh = (): Asked => ({ posted: [], read: [] });

/** How many times one reading was asked for. */
export const times = (asked: Asked, reading: string): number =>
  asked.read.filter((one) => one === reading).length;

/** One reply, as the transport would hand it over. */
const said = (answer: Says): ReturnType<Sending> =>
  Promise.resolve({
    ok: answer.status >= 200 && answer.status < 300,
    status: answer.status,
    text: () => Promise.resolve(answer.body),
  });

/** The reply at one place in a run of them, holding at the last. */
const nth = (replies: readonly Says[], at: number): Says =>
  replies[Math.min(at, replies.length - 1)] ?? started;

/** A stack that answers as it was told, and notes what was asked of it. */
export function stack(told: Told, asked: Asked): Sending {
  let redeemed = 0;
  const posts = new Map<string, number>();
  return (url, init) => {
    const at = url.replace(here, "");
    if (init.method === "POST") {
      asked.posted.push({ at, body: init.body });
      const count = posts.get(at) ?? 0;
      posts.set(at, count + 1);
      const name = at.replace("/api/actions/", "");
      return said(nth(told.acting[name] ?? [], count));
    }
    if (at.startsWith("/api/jobs/")) {
      redeemed += 1;
      return said(nth(told.becoming, redeemed - 1));
    }
    const reading = Object.entries(told.reading).find(([start]) =>
      at.startsWith(start),
    );
    if (reading === undefined) return said({ status: 404, body: "" });
    asked.read.push(reading[0]);
    return said(reading[1]);
  };
}
