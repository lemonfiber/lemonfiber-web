/**
 * Asking one running lemonfiber for something, and listening to it.
 *
 * Everything the surface knows arrives through here, and everything here arrives
 * through the client package: transport, the envelope, the wire version and the
 * stream are its concerns, and a second implementation of any of them in this
 * repository would be a surface that had learned something on its own.
 */
import {
  address,
  Client,
  follow,
  isKind,
  malformed,
  parse,
  refused,
  refusalIn,
  TOKEN_HEADER,
  unreachable,
  type Arrival,
  type ByKind,
  type Fetching,
  type Kind,
  type Problem,
  type Query,
  type Reading,
  type Sending,
} from "@lemonfiber/sdk-ts";
import type { Logged } from "../lib/wire";

/**
 * Where the stream is served.
 *
 * Stated here because the client package exposes the path to follow but not the
 * path itself, and the address it is joined to comes from the same package.
 */
const STREAM = "/api/events";

/** Where the scrollback is served. */
const SCROLLBACK = "/api/logs";

/** What reaching one running lemonfiber takes. */
export interface Reaching {
  /** Where it is listening, as the page's own address. */
  readonly at: string;
  /** The key it printed when it started serving. */
  readonly token: string;
  readonly sending: Sending;
  readonly fetching: Fetching;
}

/**
 * One endpoint's answer, narrowed to the payload the kind it names carries.
 *
 * An envelope calling itself something else is refused rather than read: the
 * generated types are what know which payload goes with which kind, and a
 * payload read under the wrong one is fields with changed meanings.
 *
 * A read that narrows by a question is given one. The client package builds the
 * query, so a value carrying a space or an ampersand is one parameter rather than
 * two, and no endpoint joins its own.
 */
export async function asked<K extends Kind>(
  reaching: Reaching,
  endpoint: string,
  kind: K,
  query?: Query,
): Promise<Reading<ByKind[K]["data"]>> {
  const opened = Client.at({
    url: reaching.at,
    token: reaching.token,
    sending: reaching.sending,
  });
  if (!opened.ok) return { ok: false, problem: opened.problem };

  const reading = await opened.client.read<unknown>(endpoint, query);
  if (!reading.ok) return { ok: false, problem: reading.problem };
  if (!isKind(reading.value, kind)) return { ok: false, problem: malformed() };

  return { ok: true, value: reading.value.data };
}

/** The stream, opened, or why it could not be. */
export type Watching =
  | { readonly ok: true; readonly arrivals: AsyncGenerator<Arrival<unknown>> }
  | { readonly ok: false; readonly problem: Problem };

/**
 * Open the stream and hand back what arrives on it.
 *
 * The signal is what says the screen has been put away: following reopens a
 * broken stream a few times before it gives up, and a screen nobody is looking
 * at any more must not be one of the reasons it tries again.
 */
export function watching(reaching: Reaching, signal: AbortSignal): Watching {
  const where = address(reaching.at);
  if (!where.ok) return { ok: false, problem: where.problem };

  return {
    ok: true,
    arrivals: follow<unknown>({
      url: `${where.base}${STREAM}`,
      token: reaching.token,
      fetching: reaching.fetching,
      signal,
    }),
  };
}

/** One thing the stream said, as against a break in it. */
export type Heard<T> = Extract<Arrival<T>, { kind: string }>;

/**
 * Whether an arrival carries the payload the kind it names carries.
 *
 * One stream carries every kind the server has anything to say about, so what
 * arrived has to be sorted before it is read: the generated types are what know
 * which payload goes with which kind, and a payload read under the wrong one is
 * fields with changed meanings. A break in the stream carries no payload at all
 * and is never one of these.
 */
export function carrying<K extends Kind>(
  arrival: Arrival<unknown>,
  kind: K,
): arrival is Heard<ByKind[K]["data"]> & { readonly kind: K } {
  return arrival.at !== "lost" && arrival.kind === kind;
}

/**
 * Whether an answer says the key this page is using is not the one expected.
 *
 * A run mints a key once, so a refusal is not something to retry — it is the
 * page holding a key from a run that has ended, and the only way out is to be
 * given the current one.
 *
 * The key alone. A read lemonfiber ran and could not answer is its own failure
 * and arrives as its own kind, so nothing here takes a stopped container engine
 * for a credential and asks an operator to replace one that is working.
 */
export function turnedAway(...answers: readonly Reading<unknown>[]): boolean {
  return answers.some(
    (answer) => !answer.ok && answer.problem.kind === "refused",
  );
}

/**
 * Every line the services have said lately.
 *
 * The scrollback is the one read that is not one document. A stream has no last
 * element to close a document with, so lemonfiber answers it the way its own
 * machine-readable output does: one envelope per line. `Client.read` parses a
 * whole body as one document, so it reads one line and reads none of them and
 * two of them alike as malformed. The body is split here instead, and each line
 * is read through the package's own envelope, at the address it validated and
 * behind the key it carries.
 *
 * The scrollback only. Nothing is followed, and a line said after the answer is
 * a line the next asking carries.
 */
export async function scrollback(
  reaching: Reaching,
): Promise<Reading<readonly Logged[]>> {
  const where = address(reaching.at);
  if (!where.ok) return { ok: false, problem: where.problem };
  if (reaching.token.trim() === "") return { ok: false, problem: refused() };

  const body = await said(reaching, `${where.base}${SCROLLBACK}`);
  if (!body.ok) return { ok: false, problem: body.problem };

  return everyLine(body.value);
}

/**
 * The body one request came back with, or why it did not.
 *
 * The scrollback is the one read whose status this surface reads for itself, so
 * the reading of it is the client package's rather than a second copy: which
 * status means which kind is settled where lemonfiber raises it, and a list kept
 * here would answer wrongly the moment one was added.
 */
async function said(reaching: Reaching, url: string): Promise<Reading<string>> {
  try {
    const answer = await reaching.sending(url, {
      method: "GET",
      headers: { [TOKEN_HEADER]: reaching.token, Accept: "application/json" },
    });
    const body = await answer.text();
    if (answer.ok) return { ok: true, value: body };
    return { ok: false, problem: refusalIn(answer.status, body) };
  } catch {
    return { ok: false, problem: unreachable() };
  }
}

/**
 * Each line of the body, read as its own envelope.
 *
 * A body carrying one thing this package cannot read is refused whole. Half a
 * scrollback drawn beside no account of what happened to the rest is a screen
 * claiming to show what a service said.
 */
function everyLine(body: string): Reading<readonly Logged[]> {
  const lines: Logged[] = [];

  for (const line of body.split("\n")) {
    if (line.trim() === "") continue;

    const envelope = parse<unknown>(line);
    if (!envelope.ok) return { ok: false, problem: envelope.problem };
    if (!isKind(envelope.value, "log")) {
      return { ok: false, problem: malformed() };
    }

    lines.push(envelope.value.data);
  }

  return { ok: true, value: lines };
}
