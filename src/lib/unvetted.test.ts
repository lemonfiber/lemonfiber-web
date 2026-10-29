import { describe, expect, it } from "vitest";
import { unvettedLines } from "./unvetted";

describe("the operator's own overlay", () => {
  it("is named with every service it changes, as unvetted", () => {
    expect(
      unvettedLines({
        overlay: "/etc/lemonfiber/overlay.yml",
        services: ["gluetun", "caddy"],
      }),
    ).toStrictEqual([
      "Your own overlay at /etc/lemonfiber/overlay.yml changes gluetun, caddy. Nothing in it is held to what lemonfiber checks, so it is unvetted.",
    ]);
  });

  it("says nothing where no overlay changes a service", () => {
    expect(unvettedLines(undefined)).toStrictEqual([]);
    expect(unvettedLines(null)).toStrictEqual([]);
  });
});
