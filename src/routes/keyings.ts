/**
 * What the keys panel is handed, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The readings inside are the ones a suite stands in for a running
 * lemonfiber, in `../api/keylists`.
 */
import { listing, phones, woken } from "../api/keylists";
import type { Previewed } from "../lib/previewed";
import type { Keyer } from "./keying.svelte";

export {
  claimed,
  listing,
  made,
  madeLocal,
  phones,
  unpaired,
  unwoken,
  woken,
} from "../api/keylists";

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** The keys, the phones' keys and the phones that can be woken read, nothing minted and nothing asked. */
export const keyer: Keyer = {
  listing: { ok: true, value: listing },
  minted: undefined,
  claimed: undefined,
  phones: { ok: true, value: phones },
  said: undefined,
  phoneSaid: undefined,
  woken: { ok: true, value: woken },
  wokenSaid: undefined,
  previewed: undefined,
  busy: false,
  onask: nothing,
  onclose: nothing,
  onleave: nothing,
};

/** What lemonfiber answers a preview that names the one it was asked about. */
const named = { ok: true, value: true } as const;

/** A preview of revoking the key `home`, naming it. */
export const keyPreviewed: Previewed = {
  doing: "key-revoke",
  name: "home",
  answer: named,
};

/** A preview of revoking the iPhone's key, naming it. */
export const phonePreviewed: Previewed = {
  doing: "device-key-revoke",
  name: "iphone",
  answer: named,
};

/** A preview of no longer waking the iPhone, naming it. */
export const wokenPreviewed: Previewed = {
  doing: "push-endpoint-remove",
  name: "iphone",
  answer: named,
};

/** A preview of no longer waking the iPhone, refused in lemonfiber's words. */
export const previewRefused: Previewed = {
  doing: "push-endpoint-remove",
  name: "iphone",
  answer: {
    ok: false,
    problem: { kind: "declined", message: "No push endpoint is named iphone" },
  },
};

/** A preview of revoking the iPhone's key, answered without naming it. */
export const previewUnnamed: Previewed = {
  doing: "device-key-revoke",
  name: "iphone",
  answer: { ok: true, value: false },
};
