import { API_VERSION, malformed } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { saidIn } from "./said";

/** One envelope, rendered as the server renders it. */
const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

describe("the sentence a reply carried", () => {
  it("takes prose as the sentence it already is", () => {
    const said = "The action `restart` needs `forms`, which was not given.";

    expect(saidIn(said)).toBe(said);
  });

  // The raw document is not something to show anyone, and the summary is the
  // sentence a reader was owed already written.
  it("reads the summary out of a problem envelope", () => {
    const summary = "The container engine is not running.";

    expect(
      saidIn(
        enveloped("error", {
          code: "engine-absent",
          summary,
          meaning: "Nothing can be started until it is.",
          remedies: [],
          severity: "error",
          state: "actionable",
        }),
      ),
    ).toBe(summary);
  });

  it("passes an envelope that is not a problem through as it stands", () => {
    const body = enveloped("status", { services: [] });

    expect(saidIn(body)).toBe(body);
  });

  it("says something of its own where nothing was said at all", () => {
    expect(saidIn("   ")).toBe(malformed().message);
  });
});
