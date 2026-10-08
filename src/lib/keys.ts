/**
 * The integration keys, in lines a reader can carry.
 *
 * Each key is named, with what it admits, what its minter said it is for,
 * where it stands, when it was minted and last used, whether a household
 * member minted it, and when it was revoked where it was. A key just minted is
 * said with what a program needs beside its secret: the certificate pin it
 * checks the stack by, and the address the stack is served at encrypted, or
 * why there is none yet.
 *
 * What lemonfiber writes into either reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./history";
import * as m from "../paraglide/messages.js";

/** Every integration key, without its secret. */
export type Listing = ByKind["keys"]["data"];

/** One key, as the listing names it. */
export type Listed = Listing["keys"][number];

/** One key just minted, its secret this once. */
export type Minted = ByKind["minted-key"]["data"];

/** What a key is for, as its minter declares. */
export type Purpose = Listed["purpose"];

/** Every purpose a key may be minted for. */
export const everyPurpose: readonly Purpose[] = [
  "home-assistant",
  "mcp",
  "other",
];

/** The scopes a key may be minted with, a member's account named beside the last. */
export const everyScope = ["read", "act", "member"] as const;

/** One scope a key may be minted with. */
export type ScopeChoice = (typeof everyScope)[number];

/** The scope a value names, or the one given where it names none. */
export function scopeChosen(value: string, fallback: ScopeChoice): ScopeChoice {
  return everyScope.find((one) => one === value) ?? fallback;
}

/** The purpose a value names, or the one given where it names none. */
export function purposeChosen(value: string, fallback: Purpose): Purpose {
  return everyPurpose.find((one) => one === value) ?? fallback;
}

/** What a key is for, in a word. */
export function wordOfPurpose(purpose: Purpose): string {
  switch (purpose) {
    case "home-assistant":
      return m.keys_purpose_home_assistant();
    case "mcp":
      return m.keys_purpose_mcp();
    case "other":
      return m.keys_purpose_other();
    default:
      return m.keys_purpose_unknown();
  }
}

/** Where a key stands, in a sentence. */
export function stateLine(state: Listed["state"]): string {
  switch (state) {
    case "active":
      return m.keys_active();
    case "revoked":
      return m.keys_revoked();
    case "orphaned":
      return m.keys_orphaned();
    case "unconfirmed":
      return m.keys_unconfirmed();
    default:
      return m.keys_state_other();
  }
}

/** A value lemonfiber may leave out, kept where it says something. */
function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}

/** One key, line by line. */
export function keyLines(key: Listed): readonly string[] {
  const lines: string[] = [
    m.keys_scope({ scope: key.scope }),
    m.keys_purpose({ purpose: wordOfPurpose(key.purpose) }),
    stateLine(key.state),
    m.keys_minted({ when: whenOf(key.minted) }),
    said(key.used)
      ? m.keys_used({ when: whenOf(key.used) })
      : m.keys_never_used(),
  ];
  if (key.member_minted) lines.push(m.keys_member_minted());
  if (said(key.revoked)) {
    lines.push(m.keys_revoked_at({ when: whenOf(key.revoked) }));
  }
  return lines;
}

/** What a program needs beside a key's secret, line by line. */
export function mintedLines(minted: Minted): readonly string[] {
  const lines: string[] = [
    m.keys_scope({ scope: minted.scope }),
    m.keys_purpose({ purpose: wordOfPurpose(minted.purpose) }),
  ];
  if (said(minted.pin)) lines.push(m.keys_pin({ pin: minted.pin }));
  if (said(minted.address)) {
    lines.push(m.keys_address({ address: minted.address }));
  }
  if (said(minted.caution)) lines.push(minted.caution);
  return lines;
}
