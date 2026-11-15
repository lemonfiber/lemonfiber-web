import { describe, expect, it } from "vitest";
import { dayOf, stamped, whenOf } from "./instant";
import { getLocale } from "../paraglide/runtime.js";

const instant = 1_791_400_000;

describe("an instant lemonfiber hands over", () => {
  it("is a day and a time in the reader's own calendar", () => {
    expect(whenOf(instant)).toBe(
      new Intl.DateTimeFormat(getLocale(), {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(1_791_400_000_000)),
    );
  });

  it("falls on a day in the reader's own calendar", () => {
    expect(dayOf(instant)).toBe(
      new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" }).format(
        new Date(1_791_400_000_000),
      ),
    );
    expect(dayOf(instant)).toContain("2026");
  });
});

describe("an instant lemonfiber may leave out", () => {
  it("is kept where it carried one, the epoch included", () => {
    expect(stamped(instant)).toBe(true);
    expect(stamped(0)).toBe(true);
  });

  it("is not where it was left out or written as null", () => {
    expect(stamped(undefined)).toBe(false);
    expect(stamped(null)).toBe(false);
  });
});
