import { beforeEach, describe, expect, it } from "vitest";
import { forget, remember, remembered } from "./token";

/** Built rather than written, so no scanner reads it as a real one. */
const key = ["a", "run", "key"].join("-");

describe("the key this page was given", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("has none until it is given one", () => {
    expect(remembered(sessionStorage)).toBeUndefined();
  });

  it("keeps what it is given", () => {
    remember(sessionStorage, key);
    expect(remembered(sessionStorage)).toBe(key);
  });

  // A run mints a key once, so a refusal means this page holds one from a run
  // that has ended. There is nothing to retry and nothing to keep.
  it("forgets a key a run has refused", () => {
    remember(sessionStorage, key);
    forget(sessionStorage);
    expect(remembered(sessionStorage)).toBeUndefined();
  });

  // A key that outlives the tab outlives the run that minted it.
  it("files it under one name, in the store the tab closing clears", () => {
    remember(sessionStorage, key);
    expect(sessionStorage).toHaveLength(1);
    expect(sessionStorage.getItem("lemonfiber-key")).toBe(key);
  });

  // A query string reaches server logs, browser history and the referrer; a
  // fragment reaches history and whatever the operator pastes.
  it("keeps it out of the address", () => {
    remember(sessionStorage, key);
    expect(globalThis.location.href).not.toContain(key);
  });
});
