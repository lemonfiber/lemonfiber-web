/**
 * Integration keys, asked of one running lemonfiber through the client package.
 *
 * Three routes of their own: the keys listed without their secrets, one minted
 * with the operator's password in the same request, and one revoked by its
 * name. The password travels in that one request's body and nothing here keeps
 * it; the secret arrives in the mint's reply and nothing here keeps that
 * either.
 */
import {
  Client,
  type ByKind,
  type Kind,
  type Minting,
  type Reading,
} from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";

/** The kind the keys are listed under, before and after a revoke. */
export const LISTED = "keys" satisfies Kind;

/** The kind one key just minted arrives under. */
export const MINTED = "minted-key" satisfies Kind;

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

/** Every integration key, without its secret. */
export async function keysOf(
  reaching: Reaching,
): Promise<Reading<ByKind[typeof LISTED]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const read = await client.value.keys();
  return read.ok ? { ok: true, value: read.value.data } : read;
}

/** One key minted, its secret in this answer and in no other. */
export async function mintingOf(
  reaching: Reaching,
  minting: Minting,
): Promise<Reading<ByKind[typeof MINTED]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const made = await client.value.mint(minting);
  return made.ok ? { ok: true, value: made.value.data } : made;
}

/** One key revoked by its name, answered with the keys as they now stand. */
export async function revokingOf(
  reaching: Reaching,
  name: string,
): Promise<Reading<ByKind[typeof LISTED]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const revoked = await client.value.revoke(name);
  return revoked.ok ? { ok: true, value: revoked.value.data } : revoked;
}
