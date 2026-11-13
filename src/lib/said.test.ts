import { describe, expect, it } from "vitest";
import { said } from "./said";

describe("whether lemonfiber said something", () => {
  it("keeps a value with something in it", () => {
    expect(said("lemonfiber.local:5055")).toBe(true);
  });

  it.each([undefined, null, ""])("drops %j as saying nothing", (value) => {
    expect(said(value)).toBe(false);
  });
});
