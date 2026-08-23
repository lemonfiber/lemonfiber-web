/**
 * The wire contract with `lemonfiber`.
 *
 * Spec: 20-architecture/contracts/web-api.md (ARCH-R46, ARCH-R55)
 */

/** The `api_version` this client speaks. Checked against the binary at build time. */
export const API_VERSION = 1;

export interface Envelope<T> {
  api_version: number;
  kind: string;
  data: T;
}

export type Read<T> =
  | { ok: true; envelope: Envelope<T> }
  | { ok: false; problem: string };

function isEnvelope(value: unknown): value is Envelope<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["api_version"] === "number" &&
    typeof candidate["kind"] === "string" &&
    "data" in candidate
  );
}

/**
 * Reads an envelope, refusing anything this client cannot speak for.
 *
 * A version mismatch names both versions and renders nothing.
 */
export function read<T>(value: unknown): Read<T> {
  if (!isEnvelope(value)) {
    return { ok: false, problem: "That reply did not come from lemonfiber." };
  }
  if (value.api_version !== API_VERSION) {
    return {
      ok: false,
      problem:
        `This page speaks version ${String(API_VERSION)} of lemonfiber's interface, ` +
        `but the copy running speaks version ${String(value.api_version)}. ` +
        `Reload the page; if that does not help, the two were built apart.`,
    };
  }
  return { ok: true, envelope: value as Envelope<T> };
}
