import { describe, expect, it } from "vitest";
import { bytes, rate, share, tally } from "./figures";

describe("bytes", () => {
  it("leaves a small count in bytes", () => {
    expect(bytes(0)).toBe("0 B");
    expect(bytes(512)).toBe("512 B");
  });

  it("steps up a unit once a count fills one", () => {
    expect(bytes(1024)).toBe("1 KB");
    expect(bytes(412_000_000_000)).toBe("384 GB");
  });

  // A fraction says something at 1.5 and nothing at 384.2.
  it("keeps one decimal only where it carries information", () => {
    expect(bytes(1536)).toBe("1.5 KB");
    expect(bytes(2048)).toBe("2 KB");
    expect(bytes(52_428_800)).toBe("50 MB");
  });

  it("stops at the largest unit it names", () => {
    expect(bytes(Number.MAX_VALUE)).toMatch(/ PB$/);
  });

  // Bytes free measures what is there, and less than none is not a state a
  // disk can be in.
  it("reads a count below nothing as nothing", () => {
    expect(bytes(-1)).toBe("0 B");
  });
});

describe("rate", () => {
  it("writes a count of bytes a second", () => {
    expect(rate(12_000_000)).toBe("11 MB/s");
    expect(rate(1_572_864)).toBe("1.5 MB/s");
  });
});

describe("tally", () => {
  it("writes a whole number", () => {
    expect(tally(0)).toBe("0");
    expect(tally(12)).toBe("12");
  });
});

describe("share", () => {
  it("turns a percentage into the share a bar is drawn from", () => {
    expect(share(0)).toBe(0);
    expect(share(62)).toBeCloseTo(0.62);
    expect(share(100)).toBe(1);
  });
});
