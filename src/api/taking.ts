/**
 * Asking for a file lemonfiber hands over, rather than a document it answers
 * with.
 *
 * A support bundle is the one: written where lemonfiber keeps its own files,
 * and handed over whole, as the bytes and the type that arrived, so a browser
 * can offer it for saving without decoding it first. The client package asks
 * for it by the path the `support` action answered with, and reads a refusal
 * the way it reads every other one.
 */
import { Client } from "@lemonfiber/sdk-ts";
import type { Reaching } from "./asking";

/** A file handed over, or why it was not. */
export type Taken =
  /** The file, and the name it was written under. */
  | { readonly ok: true; readonly file: Blob; readonly name: string }
  /** Why not, in lemonfiber's words where it wrote any. */
  | { readonly ok: false; readonly said: string; readonly refused: boolean };

/** The name a file was written under: the last part of its path. */
export function nameIn(path: string): string {
  const last = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return path.slice(last + 1);
}

/**
 * Ask for one support bundle lemonfiber wrote, by the path it was written to.
 */
export async function takingBundle(
  reaching: Reaching,
  path: string,
): Promise<Taken> {
  const opened = Client.at({
    url: reaching.at,
    token: reaching.token,
    sending: reaching.sending,
  });
  if (!opened.ok) {
    return { ok: false, said: opened.problem.message, refused: false };
  }
  const handed = await opened.client.bundle({ path });
  if (handed.ok) return { ok: true, file: handed.value, name: nameIn(path) };
  return {
    ok: false,
    said: handed.problem.message,
    refused: handed.problem.kind === "refused",
  };
}
