import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Port from "./Port.svelte";
import { everyTone, severityWord } from "../lib/state";

/** The drawing inside a tile, with the whitespace the template adds removed. */
function drawing(container: Element): string {
  const svg = container.querySelector("svg");
  return (svg?.innerHTML ?? "").replaceAll(/\s+/g, " ").trim();
}

describe("Port", () => {
  it.each(everyTone)("announces %s when it stands on its own", (tone) => {
    render(Port, { tone, label: severityWord(tone) });
    expect(screen.getByText(severityWord(tone))).toBeInTheDocument();
  });

  // Beside an eyebrow that already says it, a named tile says it twice.
  it("says nothing when text beside it already does", () => {
    const { container } = render(Port, { tone: "alarm" });
    expect(container.textContent.trim()).toBe("");
  });

  it("hides its drawing from a screen reader either way", () => {
    const { container } = render(Port, {
      tone: "alarm",
      label: severityWord("alarm"),
    });
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("what a tile looks like", () => {
  it.each(everyTone)("records the severity %s it is showing", (tone) => {
    const { container } = render(Port, { tone });
    const port = container.querySelector(".port");
    expect(port?.classList.contains(tone)).toBe(tone !== "calm");
  });

  // Colour is the last thing a tile says, not the first: the drawing has to
  // tell the severities apart in greyscale.
  it("draws a different shape for every severity", () => {
    const drawings = everyTone.map((tone) => {
      const { container } = render(Port, { tone });
      return drawing(container);
    });
    expect(new Set(drawings).size).toBe(everyTone.length);
    for (const d of drawings) expect(d).not.toBe("");
  });
});

describe("when a severity changes on a tile already on screen", () => {
  it("redraws without being remounted", async () => {
    const { container, rerender } = render(Port, { tone: "calm" });
    const calm = drawing(container);

    await rerender({ tone: "alarm" });

    expect(drawing(container)).not.toBe(calm);
    expect(container.querySelector(".port")?.classList.contains("alarm")).toBe(
      true,
    );
  });
});
