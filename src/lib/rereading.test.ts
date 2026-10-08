import { describe, expect, it } from "vitest";
import { placeChangedBy } from "./rereading";
import { forgotten, guardKept, hosted, removed } from "../api/removals";
import { reclaimedRoom } from "../api/spaces";
import { filled } from "../api/substitutions";
import { adopted } from "../api/moves";

describe("which screen a finished piece of work changed", () => {
  it("is the disk for anything taken off it", () => {
    expect(placeChangedBy({ kind: "stored", report: forgotten })).toBe(
      "storage",
    );
    expect(placeChangedBy({ kind: "uninstall", report: removed })).toBe(
      "storage",
    );
    expect(placeChangedBy({ kind: "space", report: reclaimedRoom })).toBe(
      "storage",
    );
  });

  it("is the settings for a service chosen to fill a capability", () => {
    expect(placeChangedBy({ kind: "substitution", report: filled })).toBe(
      "settings",
    );
  });

  it("is the checks for an act on a setup already here, once done", () => {
    expect(placeChangedBy({ kind: "adoption", report: adopted })).toBe(
      "checks",
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
