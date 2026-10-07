import { describe, expect, it } from "vitest";
import {
  changedTheLine,
  declarationTyped,
  everySharing,
  exceededChosen,
  givenForDeclare,
  isSharing,
  minutesTyped,
  sharing,
  type Typed,
} from "./sharing";
import { declared, shared } from "../api/lines";

const nothing: Typed = { down: "", up: "", active: "", line: "", cap: "" };

describe("what the line panel asks for", () => {
  it("is the requests it makes, and nothing else", () => {
    expect(everySharing.every(isSharing)).toBe(true);
    expect(isSharing("update")).toBe(false);
  });

  // A declaration is made at once, and nothing reads what one would do. A pause
  // holds until a resume lets it go, so neither is asked about either.
  it("asks nothing before it is sent", () => {
    expect(
      sharing.question({ doing: "bandwidth", minutes: 30 }),
    ).toBeUndefined();
    expect(sharing.question({ doing: "downloads-pause" })).toBeUndefined();
  });
});

describe("a declaration as typed", () => {
  it("is nothing where nothing was typed", () => {
    expect(
      declarationTyped({ ...nothing, down: "  " }, "pause"),
    ).toBeUndefined();
  });

  it("carries each limit typed, trimmed, and leaves the rest out", () => {
    expect(
      declarationTyped(
        { ...nothing, down: " 50% ", active: "07:00-23:00" },
        "pause",
      ),
    ).toStrictEqual({ down: "50%", active: "07:00-23:00" });
  });

  it("carries what happens at the cap only with a cap", () => {
    expect(
      declarationTyped({ ...nothing, cap: "500GB" }, "throttle"),
    ).toStrictEqual({ cap: "500GB", exceeded: "throttle" });
  });

  it("chooses what happens at the cap from what was picked", () => {
    expect(exceededChosen("continue", "pause")).toBe("continue");
    expect(exceededChosen("explode", "pause")).toBe("pause");
  });

  it("takes minutes only as a whole number above nothing", () => {
    expect(minutesTyped("30")).toBe(30);
    expect(minutesTyped("half an hour")).toBeUndefined();
  });
});

describe("what each asking sends", () => {
  it("sends the limits as they were typed", () => {
    expect(
      givenForDeclare({
        doing: "bandwidth",
        declared: { down: "50%", cap: "500GB", exceeded: "pause" },
      }),
    ).toStrictEqual({ down: "50%", cap: "500GB", exceeded: "pause" });
  });

  it("sends how long to lift the limits for", () => {
    expect(givenForDeclare({ doing: "bandwidth", minutes: 30 })).toStrictEqual({
      unrestricted_for: 30,
    });
  });

  it("sends nothing with a pause or a resume", () => {
    expect(givenForDeclare({ doing: "downloads-pause" })).toStrictEqual({});
    expect(givenForDeclare({ doing: "downloads-resume" })).toStrictEqual({});
  });
});

describe("whether the line has changed", () => {
  it("has once a declaration was written to the clients", () => {
    expect(changedTheLine({ kind: "bandwidth", report: declared })).toBe(true);
  });

  it("has not where the clients were only read, or nothing was declared", () => {
    expect(changedTheLine({ kind: "bandwidth", report: shared })).toBe(false);
    expect(changedTheLine({ kind: "unread" })).toBe(false);
  });
});
