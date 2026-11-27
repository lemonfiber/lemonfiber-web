import { describe, expect, it } from "vitest";
import * as m from "../paraglide/messages.js";
import { everyReclaiming } from "./reclaiming";
import { everyFilling } from "./filling";
import { everyMoving } from "./moving";
import { everyMending } from "./mending";
import { everyFinding } from "./finding";
import { everyHosting } from "./hosting";
import { everyRemoving } from "./removing";
import { everySeeding } from "./seeding";
import { everyPairing } from "./pairing";
import { everySharing } from "./sharing";
import { everyUpdating } from "./updating";
import { everyTending } from "./tending";
import { everyPlugging } from "./plugging";
import { everyRevoking } from "./revoking";
import { everyValuing } from "./valuing";
import {
  askable,
  askingOf,
  costly,
  everyDoing,
  everyStanding,
  givenFor,
  isDoing,
  namesItsForms,
  questionOf,
  readingOf,
  runningUnder,
  takesForms,
  titleOfDoing,
  wordOfDoing,
  type Doing,
  type Work,
} from "./work";

const said = "The action `restart` needs `forms`, which was not given.";
const job = "9f2c41ab";
const chosen = ["media"];

describe("what the console can ask for", () => {
  it.each(everyDoing)("gives %s words on a control", (doing) => {
    expect(wordOfDoing(doing, false)).not.toBe("");
    expect(wordOfDoing(doing, true)).not.toBe("");
  });

  it.each(everyDoing)("heads a record of %s with what it is doing", (doing) => {
    expect(titleOfDoing(doing, false)).not.toBe("");
    expect(titleOfDoing(doing, true)).not.toBe("");
  });

  it("gives no two of them the same words", () => {
    const words = new Set(everyDoing.map((doing) => wordOfDoing(doing, false)));
    expect(words.size).toBe(everyDoing.length);
  });

  it("gives no two of them the same heading", () => {
    const titles = new Set(
      everyDoing.map((doing) => titleOfDoing(doing, false)),
    );
    expect(titles.size).toBe(everyDoing.length);
  });

  it("tells what the overview asked for from what the other screens did", () => {
    expect(everyDoing.every(isDoing)).toBe(true);
    expect(isDoing("repair")).toBe(false);
    expect(isDoing("invite")).toBe(false);
  });

  it("heads a record of what the other screens asked for apart from the rest", () => {
    const requested = [
      ...everyDoing,
      ...everyMending,
      ...everyTending,
      ...everyPairing,
      ...everySharing,
      ...everyUpdating,
      ...everyFinding,
      ...everyHosting,
      ...everyRemoving,
      ...everySeeding,
      ...everyReclaiming,
      ...everyFilling,
      ...everyMoving,
      ...everyPlugging,
      ...everyRevoking,
      ...everyValuing,
    ];
    const titles = new Set(
      requested.map((doing) => titleOfDoing(doing, false)),
    );
    expect(titles.size).toBe(requested.length);
  });

  // The whole stack and a chosen few are different requests, and a control
  // that said the same for both would be naming the wrong one half the time.
  it("says which of the two starting and stopping reach", () => {
    expect(wordOfDoing("up", true)).not.toBe(wordOfDoing("up", false));
    expect(wordOfDoing("down", true)).not.toBe(wordOfDoing("down", false));
    expect(titleOfDoing("up", true)).not.toBe(titleOfDoing("up", false));
    expect(titleOfDoing("down", true)).not.toBe(titleOfDoing("down", false));
  });
});

describe("what an action is asked for with", () => {
  // An argument a command has nowhere to put is refused rather than dropped,
  // so a body carrying one is a request that will not be carried out at all.
  it("sends the chosen forms to the actions whose command holds them", () => {
    const plain = takesForms.filter(
      (one) => !["restart", "switch", "down"].includes(one),
    );
    expect(plain).not.toStrictEqual([]);
    for (const doing of plain) {
      expect(givenFor(doing, chosen, false)).toStrictEqual({ forms: chosen });
    }
  });

  it.each(["restart", "switch"] as const)(
    "rehearses a %s of the chosen forms rather than making it",
    (doing) => {
      expect(givenFor(doing, chosen, false)).toStrictEqual({
        forms: chosen,
        dry_run: true,
      });
    },
  );

  it("sends a stop whether the downloads are let finish first", () => {
    expect(givenFor("down", chosen, true)).toStrictEqual({
      forms: chosen,
      wait: true,
    });
    expect(givenFor("down", chosen, false)).toStrictEqual({
      forms: chosen,
      wait: false,
    });
  });

  it("sends nothing at all to the actions that take no forms", () => {
    const whole = everyDoing.filter((doing) => !takesForms.includes(doing));

    expect(whole).not.toStrictEqual([]);
    for (const doing of whole) {
      expect(givenFor(doing, chosen, false)).toStrictEqual({});
    }
  });

  // The agreement is one of the arguments an action either takes or refuses,
  // and none of the seven offered here takes it.
  it("never sends an agreement with any of them", () => {
    for (const doing of everyDoing) {
      expect(Object.keys(givenFor(doing, chosen, true))).not.toContain(
        "confirm",
      );
    }
  });
});

describe("what can be asked for at all", () => {
  it("holds back the three that have lost their subject without a form", () => {
    for (const doing of namesItsForms) {
      expect(askable(doing, [])).toBe(false);
      expect(askable(doing, chosen)).toBe(true);
    }
  });

  // Naming no form means the whole stack for these two, which is a request
  // rather than a mistake.
  it("lets starting and stopping mean the whole stack", () => {
    expect(askable("up", [])).toBe(true);
    expect(askable("down", [])).toBe(true);
  });

  it("lets what takes no form be asked without one", () => {
    expect(askable("seed", [])).toBe(true);
    expect(askable("adopt", [])).toBe(true);
  });
});

describe("what has to be agreed before it is asked for", () => {
  // Starting takes nothing away from anyone, and a stack already running is
  // not disturbed by being told to run.
  it("asks nothing before starting", () => {
    expect(questionOf("up", false)).toBeUndefined();
    expect(costly("up")).toBe(false);
  });

  it("asks nothing before fetching or wiring", () => {
    expect(costly("pull")).toBe(false);
    expect(costly("seed")).toBe(false);
  });

  it("asks what stopping costs before stopping", () => {
    const question = questionOf("down", false);

    expect(costly("down")).toBe(true);
    expect(question?.eyebrow).not.toBe("");
    expect(question?.title).not.toBe("");
    expect(question?.prose).not.toBe("");
    expect(question?.yes).not.toBe("");
  });

  it("asks about what it will actually stop", () => {
    const whole = questionOf("down", false);
    const some = questionOf("down", true);

    expect(some?.title).not.toBe(whole?.title);
    expect(some?.yes).not.toBe(whole?.yes);
  });
});

describe("what is being asked, where something waits on an answer", () => {
  it("is nothing at all when nothing is waiting", () => {
    expect(askingOf(undefined, false)).toBeUndefined();
  });

  it("holds nothing up for an action that costs nothing", () => {
    expect(askingOf("up", false)).toBeUndefined();
  });

  it("names the action a yes would ask for, beside the question", () => {
    const asking = askingOf("down", false);

    expect(asking?.doing).toBe("down");
    expect(asking?.question).toStrictEqual(questionOf("down", false));
  });
});

describe("how a record of what was asked for reads", () => {
  const of = (at: Work["at"], doing: Doing = "up"): Work => {
    const asked = { id: "1", doing, scoped: false, given: {} };
    switch (at) {
      case "under-way":
        return { ...asked, at, job };
      case "done":
        return { ...asked, at, job: undefined, came: { kind: "unread" } };
      case "stopped":
        return { ...asked, at, said };
      case "ended":
        return { ...asked, at, job, ending: "released" };
      case "forgotten":
        return { ...asked, at, job };
      case "adrift":
        return { ...asked, at, job, said };
      case "declined":
        return { ...asked, at, said };
    }
  };

  // Unfinished is not untrusted: work the runtime is holding is being done
  // now, and the interface reads that in full ink.
  it("reads work the runtime is holding as part way through", () => {
    expect(readingOf(of("under-way")).state).toBe("part");
  });

  it("names the work in the words a reader gets", () => {
    expect(readingOf(of("under-way")).prose).toContain(job);
  });

  it("reads work that finished while the request was open as measured", () => {
    const read = readingOf(of("done"));

    expect(read.state).toBe("known");
    expect(read.prose).not.toBe("");
  });

  it("names the work whose name was redeemed and had finished", () => {
    const read = readingOf({
      id: "1",
      doing: "up",
      scoped: false,
      given: {},
      at: "done",
      job,
      came: { kind: "unread" },
    });

    expect(read.state).toBe("known");
    expect(read.prose).toContain(job);
  });

  // What went wrong is lemonfiber's own account of it. A failure restated in
  // this surface's words would be this surface's guess at a cause it did not
  // see.
  it("carries what stopped the work through unchanged", () => {
    const read = readingOf(of("stopped"));

    expect(read.state).toBe("stopped");
    expect(read.prose).toBe(said);
  });

  // Nothing is wrong with a name this run has forgotten; there is only nothing
  // left to say about it, which is not an alarm.
  it("reads a name this run no longer knows as never measured", () => {
    const read = readingOf(of("forgotten"));

    expect(read.state).toBe("unknown");
    expect(read.prose).toContain(job);
  });

  // The work may be running perfectly well. What has stopped is the asking.
  it("reads work it has lost the thread of as the last thing known", () => {
    const read = readingOf(of("adrift"));

    expect(read.state).toBe("quiet");
    expect(read.prose).toContain(job);
    expect(read.prose).toContain(said);
  });

  // The words are lemonfiber's own. A refusal restated in this surface's words
  // would be this surface's account of a decision it did not make.
  it("carries a refusal's own sentence through unchanged", () => {
    const read = readingOf(of("declined", "down"));

    expect(read.state).toBe("stopped");
    expect(read.prose).toBe(said);
  });

  it("gives every record a state and words of its own", () => {
    const eyebrows = everyStanding.map((at) => readingOf(of(at)).eyebrow);

    expect(new Set(eyebrows).size).toBe(everyStanding.length);
  });

  // Ending before it finished is neither finishing nor failing, and how it
  // ended is lemonfiber's word: a name released, work let go unasked, or the
  // services it followed gone quiet.
  it.each([
    ["released", m.work_ended_released({ job })],
    ["let-go", m.work_ended_let_go({ job })],
    ["quiet", m.work_ended_quiet({ job })],
  ] as const)("says work that ended %s how it ended", (ending, says) => {
    const read = readingOf({ ...of("ended"), at: "ended", job, ending });

    expect(read.state).toBe("known");
    expect(read.eyebrow).toBe(m.eyebrow_ended_early());
    expect(read.prose).toBe(says);
  });

  it("says of work under way that putting its record away leaves it running", () => {
    expect(readingOf(of("under-way")).prose).toBe(m.work_under_way({ job }));
    expect(m.work_under_way({ job })).toContain("the work runs on");
  });
});

describe("the work a record may still name", () => {
  const asked = { id: "1", doing: "up", scoped: false, given: {} } as const;

  it.each(["under-way", "adrift"] as const)(
    "is named where the work is %s",
    (at) => {
      expect(runningUnder({ ...asked, at, job, said })).toBe(job);
    },
  );

  it("is nothing once the work has an end to say", () => {
    expect(
      runningUnder({ ...asked, at: "done", job, came: { kind: "unread" } }),
    ).toBeUndefined();
    expect(
      runningUnder({ ...asked, at: "ended", job, ending: "let-go" }),
    ).toBeUndefined();
    expect(runningUnder({ ...asked, at: "forgotten", job })).toBeUndefined();
    expect(runningUnder({ ...asked, at: "stopped", said })).toBeUndefined();
  });
});
