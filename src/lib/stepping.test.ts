import { describe, expect, it } from "vitest";
import {
  heardWith,
  stepLine,
  walkingLines,
  wordOfStepStage,
  type Step,
} from "./stepping";
import * as m from "../paraglide/messages.js";

const searching: Step = {
  step: "searching",
  said: "Asking the indexers for Andor.",
  detail: "",
};
const importing: Step = {
  step: "importing",
  said: "Moving it into the library.",
  detail: "It was copied, not linked.",
};

describe("a walkthrough's steps as they happen", () => {
  it.each([
    "choosing",
    "searching",
    "grabbing",
    "downloading",
    "importing",
    "scanning",
    "available",
  ] as const)("gives the stage %s a word", (stage) => {
    expect(wordOfStepStage(stage)).not.toBe(m.step_other());
  });

  it("says a stage it has no word for as that", () => {
    expect(wordOfStepStage("waiting" as unknown as Step["step"])).toBe(
      m.step_other(),
    );
  });

  it("says each step after its stage, with any detail beside", () => {
    expect(stepLine(searching)).toBe(
      m.step_line({ stage: m.step_searching(), said: searching.said }),
    );
    expect(stepLine(importing)).toBe(
      m.step_line_detail({
        stage: m.step_importing(),
        said: importing.said,
        detail: importing.detail,
      }),
    );
  });

  it("keeps each step under the walk it was said for, in the order heard", () => {
    const heard = heardWith(
      heardWith(heardWith({}, "5c63", searching), "9f2c", searching),
      "5c63",
      importing,
    );
    expect(walkingLines(heard, "5c63")).toStrictEqual([
      stepLine(searching),
      stepLine(importing),
    ]);
    expect(walkingLines(heard, "9f2c")).toStrictEqual([stepLine(searching)]);
    expect(walkingLines(heard, "0000")).toStrictEqual([]);
  });
});
