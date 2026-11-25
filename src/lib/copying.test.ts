import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  figuresOf,
  heldIn,
  partOf,
  runningOf,
  shareOf,
  startedOf,
  stateOf,
  titleOf,
  toneOf,
} from "./copying";
import { bytes, rate } from "./figures";
import { whenOf } from "./instant";
import {
  backingUp,
  copyingNone,
  copyingNow,
  pacedBackup,
  stalledRestore,
} from "../api/copyings";
import * as m from "../paraglide/messages.js";

describe("what a reading of the copy running holds", () => {
  it("is what it answered, where it could be read", () => {
    expect(heldIn({ ok: true, value: copyingNow })).toBe(copyingNow);
  });

  it("is nothing where it could not be read, or has not been asked", () => {
    expect(heldIn({ ok: false, problem: unreachable() })).toBeUndefined();
    expect(heldIn(undefined)).toBeUndefined();
  });
});

describe("the copy running", () => {
  it("is the one the stack names", () => {
    expect(runningOf(copyingNow)).toBe(backingUp);
  });

  it("is none where the stack names none, or has said nothing", () => {
    expect(runningOf(copyingNone)).toBeUndefined();
    expect(runningOf({})).toBeUndefined();
    expect(runningOf(undefined)).toBeUndefined();
  });
});

describe("a running copy, in words", () => {
  it("is headed by whether it is a backup or a restore", () => {
    expect(titleOf(backingUp)).toBe(m.copying_backup());
    expect(titleOf(stalledRestore)).toBe(m.copying_restore());
  });

  it("says how much it has written of how much it will", () => {
    expect(figuresOf(backingUp)).toBe(
      m.copying_written({
        written: bytes(backingUp.written),
        whole: bytes(backingUp.whole),
      }),
    );
  });

  it("draws the share written, and none where it will write nothing", () => {
    expect(shareOf(stalledRestore)).toBe(0.5);
    expect(shareOf({ ...backingUp, written: 0, whole: 0 })).toBe(0);
  });

  it("says it is working, slowed to the limit set, or stalled since it last wrote", () => {
    expect(stateOf(backingUp)).toBe(m.copying_working());
    expect(stateOf(pacedBackup)).toBe(
      m.copying_paced({ limit: rate(52428800) }),
    );
    expect(stateOf(stalledRestore)).toBe(
      m.copying_stalled({ wrote: whenOf(stalledRestore.wrote) }),
    );
  });

  it("draws a stall as worth looking at, and anything else calm", () => {
    expect(toneOf(stalledRestore)).toBe("watch");
    expect(toneOf(pacedBackup)).toBe("calm");
    expect(toneOf(backingUp)).toBe("calm");
  });

  it("names the part it is writing as the stack names it, and when it started", () => {
    expect(partOf(backingUp)).toBe(m.copying_part({ part: "sonarr database" }));
    expect(startedOf(backingUp)).toBe(
      m.copying_started({ when: whenOf(backingUp.started) }),
    );
  });
});
