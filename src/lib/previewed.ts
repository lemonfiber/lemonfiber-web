/**
 * What previewing a revocation answered, in words a reader can carry.
 *
 * Revoking a key, revoking a phone's key and removing a phone that can be woken
 * can each be previewed: lemonfiber answers what saying yes would come to and
 * changes nothing. A preview is offered and never asked for, so the yes goes
 * ahead whether or not one was read, and a preview that could not be read says
 * so and holds nothing back. Only the name a preview answers with is read from
 * it, so nothing it shows can carry a secret or a whole wake address.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** The three revocations that can be previewed, named as the parity names them. */
export type Revocation =
  "key-revoke" | "device-key-revoke" | "push-endpoint-remove";

/** What one preview answered, kept beside the question it was asked from. */
export interface Previewed {
  /** The revocation previewed. */
  readonly doing: Revocation;
  /** The one it was asked about. */
  readonly name: string;
  /**
   * Whether lemonfiber named that one as what saying yes would reach, or why
   * the preview could not be read.
   */
  readonly answer: Reading<boolean>;
}

/** What a preview says: lemonfiber's sentence where it could not be read, and a line. */
export interface PreviewSaid {
  readonly problem: string | undefined;
  readonly line: string;
}

/**
 * What a revocation asked as a preview answered, as kept beside its question;
 * nothing where lemonfiber answered it as no preview at all, which means it
 * was carried out.
 */
export function previewOf<T extends { readonly rehearsed: boolean }>(
  doing: Revocation,
  name: string,
  answer: Reading<T>,
  named: (value: T) => string | null | undefined,
): Previewed | undefined {
  if (!answer.ok) return { doing, name, answer };
  if (!answer.value.rehearsed) return undefined;
  return {
    doing,
    name,
    answer: { ok: true, value: named(answer.value) === name },
  };
}

/** What saying yes would do, as a preview naming it says. */
function wouldOf(doing: Revocation, name: string): string {
  switch (doing) {
    case "key-revoke":
      return m.keys_preview_would({ name });
    case "device-key-revoke":
      return m.phones_preview_would({ name });
    case "push-endpoint-remove":
      return m.woken_preview_would({ name });
  }
}

/** What one preview says. */
export function previewSaid(previewed: Previewed): PreviewSaid {
  const { answer, doing, name } = previewed;
  if (!answer.ok) {
    return { problem: answer.problem.message, line: m.preview_unread() };
  }
  return {
    problem: undefined,
    line: answer.value ? wouldOf(doing, name) : m.preview_unnamed({ name }),
  };
}
