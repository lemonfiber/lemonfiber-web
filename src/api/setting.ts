/**
 * First-run setup, asked of one running lemonfiber through the client package.
 *
 * Six routes of their own: where setup stands, and one step of it each for an
 * answer, on, back, apply and the way out of an apply that stopped part-way.
 * Each answers with where setup then stands. An answer may carry a credential;
 * it travels in that one request's body and nothing here keeps it.
 */
import { Client, type Kind, type Reading } from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";
import type { Move, Wizard } from "../lib/wizard";

/** The kind every step of setup answers with. */
export const STANDING = "wizard" satisfies Kind;

/** The client this run is reached through, or why none could be opened. */
function opened(reaching: Reaching): Reading<Client> {
  const opening = Client.at({
    url: reaching.at,
    token: reaching.token,
    sending: reaching.sending,
  });
  return opening.ok
    ? { ok: true, value: opening.client }
    : { ok: false, problem: opening.problem };
}

/** Where setup stands. Asking changes nothing. */
export async function standingOf(reaching: Reaching): Promise<Reading<Wizard>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const read = await client.value.setup();
  return read.ok ? { ok: true, value: read.value.data } : read;
}

/** One step of setup, answered with where it left setup. */
export async function movedBy(
  reaching: Reaching,
  move: Move,
): Promise<Reading<Wizard>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const walked = await stepOf(client.value, move);
  return walked.ok ? { ok: true, value: walked.value.data } : walked;
}

/** The call one step is made with. */
function stepOf(client: Client, move: Move): ReturnType<Client["setup"]> {
  switch (move.move) {
    case "next":
      return client.setupNext();
    case "back":
      return client.setupBack();
    case "answer":
      return client.setupAnswer(move.answer);
    case "apply":
      return client.setupApply();
    case "recover":
      return client.setupRecover(move.choice);
  }
}
