/**
 * Handing a file lemonfiber wrote to the browser, to be saved where the reader
 * chooses.
 *
 * The file is asked for whole and offered as a download under the name it was
 * written with. Nothing is kept here beyond whether it is being asked for and,
 * where it could not be, why, in lemonfiber's words.
 */
import type { Handing } from "../api/asking";
import { takingBundle } from "../api/taking";
import type { Saver } from "../lib/upkeep";

/**
 * Offer a file to the browser as a download.
 *
 * The address it is offered from is let go once the download has started,
 * so a file saved twice is asked for twice rather than held on to.
 */
export function offerFile(file: Blob, name: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  globalThis.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

/** Whether a file is being asked for, and why the last one was not handed over. */
export class Saving {
  /** Whether a file is being asked for. */
  busy = $state(false);

  /** Why the last file asked for was not handed over, where it was not. */
  said = $state<string | undefined>(undefined);

  readonly #handing: Handing;

  constructor(handing: Handing) {
    this.#handing = handing;
  }

  /** Ask for the bundle written to this path, and offer it for saving. */
  async save(path: string): Promise<void> {
    this.busy = true;
    this.said = undefined;
    const taken = await takingBundle(this.#handing.reaching(), path);
    this.busy = false;
    if (taken.ok) {
      offerFile(taken.file, taken.name);
      return;
    }
    if (taken.refused) this.#handing.onrefused();
    this.said = taken.said;
  }

  /** What the support panel is handed to save with. */
  get saver(): Saver {
    return {
      busy: this.busy,
      said: this.said,
      onsave: (path: string) => {
        void this.save(path);
      },
    };
  }
}
