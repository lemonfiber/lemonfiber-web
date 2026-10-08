/**
 * Keeping integration keys: listing them, minting one and revoking one.
 *
 * The one credential write this surface makes, and not an action: keys are
 * kept through routes of their own, so none of it goes through the desk the
 * actions do. Being turned away is passed on as every other refusal of the
 * key. A password is handed in for one mint and kept by nothing here. A secret
 * is held in memory only until the operator closes it, and a reload, or
 * leaving the console, loses it with everything else this page holds.
 */
import type { Minting, Reading } from "@lemonfiber/sdk-ts";
import { turnedAway, type Handing } from "../api/asking";
import { keysOf, mintingOf, revokingOf } from "../api/keying";
import type { Listing, Minted } from "../lib/keys";

/** One thing the keys panel asks for, named as the parity names it. */
export type KeyAsking =
  | { readonly doing: "key-list" }
  | { readonly doing: "key-mint"; readonly minting: Minting }
  | { readonly doing: "key-revoke"; readonly name: string };

/** Every request the keys panel makes. */
export const everyKeying: readonly KeyAsking["doing"][] = [
  "key-list",
  "key-mint",
  "key-revoke",
];

/** What the keys panel is handed to keep keys with. */
export interface Keyer {
  /** Every key, or why they could not be read. Nothing until asked. */
  readonly listing: Reading<Listing> | undefined;
  /** A key just minted, its secret held until it is closed. */
  readonly minted: Minted | undefined;
  /** Why the last mint or revoke was not carried out, in lemonfiber's words. */
  readonly said: string | undefined;
  /** Whether a mint or a revoke is under way, which silences the controls. */
  readonly busy: boolean;
  /** List the keys again, mint one, or revoke one. */
  readonly onask: (asking: KeyAsking) => void;
  /** Close the key just minted, dropping its secret. */
  readonly onclose: () => void;
}

/** The keys, a key just minted, and what the last write came to. */
export class Keying {
  listing = $state<Reading<Listing> | undefined>(undefined);
  minted = $state<Minted | undefined>(undefined);
  said = $state<string | undefined>(undefined);
  busy = $state(false);

  readonly #handing: Handing;

  constructor(handing: Handing) {
    this.#handing = handing;
  }

  /** Take an answer, passing on a refused key. */
  #heard<T>(answer: Reading<T>): Reading<T> {
    if (turnedAway(answer)) this.#handing.onrefused();
    return answer;
  }

  /** Read every key. */
  async read(): Promise<void> {
    this.listing = this.#heard(await keysOf(this.#handing.reaching()));
  }

  /** Mint one key, then read the keys again. */
  async mint(minting: Minting): Promise<void> {
    this.busy = true;
    this.said = undefined;
    const made = this.#heard(
      await mintingOf(this.#handing.reaching(), minting),
    );
    this.busy = false;
    if (!made.ok) {
      this.said = made.problem.message;
      return;
    }
    this.minted = made.value;
    await this.read();
  }

  /** Revoke one key, taking the keys as they now stand. */
  async revoke(name: string): Promise<void> {
    this.busy = true;
    this.said = undefined;
    const left = this.#heard(await revokingOf(this.#handing.reaching(), name));
    this.busy = false;
    if (left.ok) this.listing = left;
    else this.said = left.problem.message;
  }

  /** Carry out one asking. */
  async ask(asking: KeyAsking): Promise<void> {
    switch (asking.doing) {
      case "key-list":
        await this.read();
        return;
      case "key-mint":
        await this.mint(asking.minting);
        return;
      case "key-revoke":
        await this.revoke(asking.name);
        return;
    }
  }

  /** Close the key just minted. */
  close(): void {
    this.minted = undefined;
  }

  /** What the keys panel is handed. */
  get keyer(): Keyer {
    return {
      listing: this.listing,
      minted: this.minted,
      said: this.said,
      busy: this.busy,
      onask: (asking) => {
        void this.ask(asking);
      },
      onclose: () => {
        this.close();
      },
    };
  }
}
