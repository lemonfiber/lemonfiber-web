/**
 * What this browser keeps for itself, and nothing else does.
 *
 * Its own storage, reached in a way that survives a browser that keeps nothing:
 * a private window, cleared storage, or storage switched off throws where it
 * is reached, and is then read as a browser keeping nothing.
 */

/** The slice of browser storage kept things need, so a test can supply its own. */
export type Keeping = Pick<Storage, "getItem" | "setItem">;

/** This browser's storage, or nothing where reaching it throws. */
export function browserKeeping(): Keeping | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
