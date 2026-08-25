import { describe, expect, it } from "vitest";
import {
  askingOf,
  costly,
  everyDoing,
  questionOf,
  readingOf,
  titleOfDoing,
  wordOfDoing,
  type Doing,
  type Work,
} from "./work";

const said = "The action `restart` needs `forms`, which was not given.";

describe("what the console can ask for", () => {
  it.each(everyDoing)("gives %s words on a control", (doing) => {
    expect(wordOfDoing(doing)).not.toBe("");
  });

  it.each(everyDoing)("heads a record of %s with what it is doing", (doing) => {
    expect(titleOfDoing(doing)).not.toBe("");
  });

  it("gives no two of them the same words", () => {
    const words = new Set(everyDoing.map((doing) => wordOfDoing(doing)));
    expect(words.size).toBe(everyDoing.length);
  });
});

describe("what has to be agreed before it is asked for", () => {
  // Starting takes nothing away from anyone, and a stack already running is
  // not disturbed by being told to run.
  it("asks nothing before starting", () => {
    expect(questionOf("up")).toBeUndefined();
    expect(costly("up")).toBe(false);
  });

  it("asks what stopping costs before stopping", () => {
    const question = questionOf("down");

    expect(costly("down")).toBe(true);
    expect(question?.eyebrow).not.toBe("");
    expect(question?.title).not.toBe("");
    expect(question?.prose).not.toBe("");
  });
});

describe("what is being asked, where something waits on an answer", () => {
  it("is nothing at all when nothing is waiting", () => {
    expect(askingOf(undefined)).toBeUndefined();
  });

  it("holds nothing up for an action that costs nothing", () => {
    expect(askingOf("up")).toBeUndefined();
  });

  it("names the action a yes would ask for, beside the question", () => {
    const asking = askingOf("down");

    expect(asking?.doing).toBe("down");
    expect(asking?.question).toStrictEqual(questionOf("down"));
  });
});

describe("how a record of what was asked for reads", () => {
  const of = (at: Work["at"], doing: Doing = "up"): Work => {
    switch (at) {
      case "under-way":
        return { id: "1", doing, at, job: "9f2c41ab" };
      case "done":
        return { id: "1", doing, at };
      case "declined":
        return { id: "1", doing, at, said };
    }
  };

  // Unfinished is not untrusted: work the runtime is holding is being done
  // now, and the interface reads that in full ink.
  it("reads work the runtime is holding as part way through", () => {
    expect(readingOf(of("under-way")).state).toBe("part");
  });

  it("names the work in the words a reader gets", () => {
    expect(readingOf(of("under-way")).prose).toContain("9f2c41ab");
  });

  it("reads work that finished while the request was open as measured", () => {
    const read = readingOf(of("done"));

    expect(read.state).toBe("known");
    expect(read.prose).not.toBe("");
  });

  // The words are lemonfiber's own. A refusal restated in this surface's words
  // would be this surface's account of a decision it did not make.
  it("carries a refusal's own sentence through unchanged", () => {
    const read = readingOf(of("declined", "down"));

    expect(read.state).toBe("stopped");
    expect(read.prose).toBe(said);
  });

  it("gives every record a state and words of its own", () => {
    const every: readonly Work["at"][] = ["under-way", "done", "declined"];
    const eyebrows = every.map((at) => readingOf(of(at)).eyebrow);

    expect(new Set(eyebrows).size).toBe(every.length);
  });
});
