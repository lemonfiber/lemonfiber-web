/**
 * Integration keys, asked of one running lemonfiber through the client package.
 *
 * Routes of their own: the keys listed without their secrets, one minted with
 * the operator's password in the same request, either with its secret or as a
 * claim a program collects it with, and one revoked by its name; then the
 * phones' hardware keys listed and one revoked by its name, then the phones
 * that can be woken listed and one removed by its name. The password
 * travels in that one request's body and nothing here keeps it; the secret or
 * the claim arrives in the mint's reply and nothing here keeps that either.
 */
import type { ByKind, Kind, Minting, Reading } from "@lemonfiber/sdk-ts";
import { opened, type Reaching } from "./asking";

/** The kind the keys are listed under, before and after a revoke. */
export const LISTED = "keys" satisfies Kind;

/** The kind one key just minted arrives under. */
export const MINTED = "minted-key" satisfies Kind;

/** The kind one key minted as a claim arrives under. */
export const CLAIMED = "key-claim" satisfies Kind;

/** The kind the phones' hardware keys are listed under, before and after a revoke. */
export const PHONES = "device-keys" satisfies Kind;

/** The kind the phones that can be woken are listed under, before and after a removal. */
export const WOKEN = "push-endpoints" satisfies Kind;

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

/** One key minted as a claim: the link a program collects it with, and no secret. */
export async function claimingOf(
  reaching: Reaching,
  minting: Minting,
): Promise<Reading<ByKind[typeof CLAIMED]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const made = await client.value.mintClaim(minting);
  return made.ok ? { ok: true, value: made.value.data } : made;
}

/** Every phone's hardware key, revoked ones included. */
export async function phonesOf(
  reaching: Reaching,
): Promise<Reading<ByKind[typeof PHONES]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const read = await client.value.deviceKeys();
  return read.ok ? { ok: true, value: read.value.data } : read;
}

/** One phone's hardware key revoked by its name, answered with them as they now stand. */
export async function phoneRevokingOf(
  reaching: Reaching,
  name: string,
): Promise<Reading<ByKind[typeof PHONES]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const revoked = await client.value.revokeDeviceKey(name);
  return revoked.ok ? { ok: true, value: revoked.value.data } : revoked;
}

/** Every phone that can be woken, each with its whole address. */
export async function wokenOf(
  reaching: Reaching,
): Promise<Reading<ByKind[typeof WOKEN]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const read = await client.value.pushEndpoints.list();
  return read.ok ? { ok: true, value: read.value.data } : read;
}

/** One phone that can be woken removed by its name, answered with them as they now stand. */
export async function wokenRemovingOf(
  reaching: Reaching,
  name: string,
): Promise<Reading<ByKind[typeof WOKEN]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const removed = await client.value.pushEndpoints.remove(name);
  return removed.ok ? { ok: true, value: removed.value.data } : removed;
}
