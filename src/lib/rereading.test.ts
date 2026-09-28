import { describe, expect, it } from "vitest";
import { placeChangedBy } from "./rereading";
import { forgotten, guardKept, hosted, removed } from "../api/removals";

describe("which screen a finished piece of work changed", () => {
  it("is the disk for anything taken off it", () => {
    expect(placeChangedBy({ kind: "stored", report: forgotten })).toBe(
      "storage",
    );
    expect(placeChangedBy({ kind: "uninstall", report: removed })).toBe(
      "storage",
    );
  });

  it("is the overview for a command kept running or taken back", () => {
    expect(placeChangedBy({ kind: "hosting", report: guardKept })).toBe(
      "overview",
    );
  });

  it("is none for a reading, or for what this page does not read", () => {
    expect(placeChangedBy({ kind: "hosting", report: hosted })).toBeUndefined();
    expect(placeChangedBy({ kind: "unread" })).toBeUndefined();
  });
});
