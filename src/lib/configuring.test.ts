import { describe, expect, it } from "vitest";
import {
  changedTheSettings,
  configuring,
  everyConfiguring,
  givenForChange,
  isConfiguring,
  standingChange,
} from "./configuring";
import type { Work } from "./work";
import { applied, madeAtOnce, staged } from "../api/configs";

/** A record of one change, answered with what it came to. */
const answered = (
  id: string,
  given: Work["given"],
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "config-set",
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came,
});

const moving = { key: "data_location", value: "/mnt/media" };

describe("what the settings panel asks for", () => {
  it("is every request it makes, and nothing else", () => {
    expect(everyConfiguring.every(isConfiguring)).toBe(true);
    expect(isConfiguring("backup")).toBe(false);
  });

  // lemonfiber decides whether a change costs something, and answers with
  // the review where it does, so nothing is asked here first.
  it("asks nothing first, and sends the setting and its value", () => {
    const change = { doing: "config-set", ...moving } as const;
    expect(configuring.question(change)).toBeUndefined();
    expect(givenForChange(change)).toStrictEqual(moving);
  });

  it("sends the yes with whether what is coming down may finish first", () => {
    expect(
      givenForChange({
        doing: "config-set",
        ...moving,
        confirm: true,
        wait: true,
      }),
    ).toStrictEqual({ ...moving, confirm: true, wait: true });
  });

  it("reads the settings again once one changed, and not for a review", () => {
    expect(changedTheSettings({ kind: "config", report: applied })).toBe(true);
    expect(changedTheSettings({ kind: "config", report: staged })).toBe(false);
    expect(changedTheSettings({ kind: "unread" })).toBe(false);
  });
});

describe("the change staged on the screen", () => {
  const read = answered("2", moving, { kind: "config", report: staged });

  it("is the newest staged change, and says whether it interrupts anything", () => {
    expect(standingChange([read])).toStrictEqual({
      id: "2",
      ...moving,
      interrupts: true,
    });
  });

  it("interrupts nothing where nothing is coming down", () => {
    const quiet = answered("3", moving, {
      kind: "config",
      report: {
        ...staged,
        review: {
          change: {
            cost: "consequential",
            from: "/srv/media",
            key: "data_location",
            to: "/mnt/media",
          },
          stance: "pending",
        },
      },
    });
    expect(standingChange([quiet])?.interrupts).toBe(false);
  });

  it("is gone once the change was made", () => {
    const done = answered("4", moving, { kind: "config", report: applied });
    expect(standingChange([done, read])).toBeUndefined();
    const cheap = answered("5", moving, { kind: "config", report: madeAtOnce });
    expect(standingChange([cheap])).toBeUndefined();
  });

  it("is nothing where no change was asked for, the answer is not one, or it names nothing", () => {
    const unread = answered("6", moving, { kind: "unread" });
    const unnamed = answered("7", {}, { kind: "config", report: staged });
    const valueless = answered(
      "8",
      { key: "data_location" },
      { kind: "config", report: staged },
    );
    expect(standingChange([])).toBeUndefined();
    expect(standingChange([unread])).toBeUndefined();
    expect(standingChange([unnamed])).toBeUndefined();
    expect(standingChange([valueless])).toBeUndefined();
  });
});
