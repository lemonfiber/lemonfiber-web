import { API_VERSION, type ByKind, type Kind } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { outcomeOf } from "./outcome";
import { ran } from "../routes/fixture";

/** One envelope, as a finished job is redeemed for it. */
const sealed = <K extends Kind>(kind: K, data: ByKind[K]["data"]) => ({
  api_version: API_VERSION,
  kind,
  data,
});

const wired: ByKind["seed"]["data"] = {
  assessment: "assessed",
  rehearsed: false,
  wirings: [],
};

describe("what an envelope says a piece of work came to", () => {
  it("reads what a start, stop, switch, restart or fetch came to", () => {
    expect(outcomeOf(sealed("lifecycle", ran))).toStrictEqual({
      kind: "lifecycle",
      report: ran,
    });
  });

  it("reads what wiring the programs to each other came to", () => {
    expect(outcomeOf(sealed("seed", wired))).toStrictEqual({
      kind: "seed",
      report: wired,
    });
  });

  // A payload read under the wrong kind is fields with changed meanings, so
  // an envelope nothing here reads is kept as unread rather than guessed at.
  it("keeps an outcome nothing here reads as unread", () => {
    expect(
      outcomeOf(
        sealed("quality", {
          choices: [],
          customised: false,
          disposition: "reapplied",
        }),
      ),
    ).toStrictEqual({ kind: "unread" });
  });
});
