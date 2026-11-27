/**
 * What the keys panel is handed, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The readings inside are the ones a suite stands in for a running
 * lemonfiber, in `../api/keylists`.
 */
import { listing, phones } from "../api/keylists";
import type { Keyer } from "./keying.svelte";

export {
  claimed,
  listing,
  made,
  madeLocal,
  phones,
  unpaired,
} from "../api/keylists";

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** The keys and the phones' keys read, nothing minted and nothing asked. */
export const keyer: Keyer = {
  listing: { ok: true, value: listing },
  minted: undefined,
  claimed: undefined,
  phones: { ok: true, value: phones },
  said: undefined,
  phoneSaid: undefined,
  busy: false,
  onask: nothing,
  onclose: nothing,
};
