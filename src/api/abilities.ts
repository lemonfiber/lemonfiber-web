/**
 * What the signed-in key can use, asked of one running lemonfiber through the
 * client package: every request the stack has, by the path it is served at,
 * as this key may make it.
 */
import type { ByKind, Kind, Reading } from "@lemonfiber/sdk-ts";
import { opened, type Reaching } from "./asking";

/** The kind what the key can use is answered under. */
export const ABLE = "capabilities" satisfies Kind;

/** What the signed-in key can use, and whose key it is. */
export async function ableOf(
  reaching: Reaching,
): Promise<Reading<ByKind[typeof ABLE]["data"]>> {
  const client = opened(reaching);
  if (!client.ok) return client;
  const read = await client.value.capabilities();
  return read.ok ? { ok: true, value: read.value.data } : read;
}
