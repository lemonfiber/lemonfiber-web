import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Banner from "./Banner.svelte";
import { everyTone, severityWord } from "../lib/state";

const actions = createRawSnippet(() => ({
  render: () => `<button type="button">Hide this</button>`,
}));

const lost = {
  tone: "watch",
  lead: "Lost contact with your stack.",
  prose: "Every figure below is the last one confirmed, not what is true now.",
} as const;

describe("Banner", () => {
  it("leads with what happened", () => {
    render(Banner, lost);
    expect(screen.getByText(lost.lead)).toBeInTheDocument();
  });

  it("says what it means for everything below it", () => {
    render(Banner, lost);
    expect(screen.getByText(lost.prose)).toBeInTheDocument();
  });

  it("offers the actions it was given", () => {
    render(Banner, { ...lost, actions });
    expect(
      screen.getByRole("button", { name: "Hide this" }),
    ).toBeInTheDocument();
  });

  it("offers nothing where there is nothing to press", () => {
    const { container } = render(Banner, lost);
    expect(container.querySelector(".acts")).toBeNull();
  });
});

describe("the severity a banner carries", () => {
  // Nothing beside the tile says what it means, as a row's eyebrow does, so
  // the tile has to say it itself.
  it.each(everyTone)("names the severity %s it is showing", (tone) => {
    render(Banner, { ...lost, tone });
    expect(screen.getByText(severityWord(tone))).toBeInTheDocument();
  });

  it.each(everyTone)("terminates %s in a port of that severity", (tone) => {
    const { container } = render(Banner, { ...lost, tone });
    expect(container.querySelector(".port")?.classList.contains(tone)).toBe(
      tone !== "calm",
    );
  });

  it.each(everyTone)("tints the ground for %s to match", (tone) => {
    const { container } = render(Banner, { ...lost, tone });
    expect(container.querySelector(".banner")?.classList.contains(tone)).toBe(
      tone !== "calm",
    );
  });
});

describe("how loudly a banner arrives", () => {
  it("interrupts the reader when it wants them now", () => {
    render(Banner, { ...lost, tone: "alarm" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it.each(everyTone.filter((tone) => tone !== "alarm"))(
    "waits for the reader's next pause when it is only %s",
    (tone) => {
      render(Banner, { ...lost, tone });
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );
});

describe("when a banner's severity changes while it is on screen", () => {
  it("changes its port, its ground and how loudly it speaks together", async () => {
    const { container, rerender } = render(Banner, { ...lost, tone: "watch" });
    expect(screen.getByRole("status")).toBeInTheDocument();

    await rerender({ tone: "alarm" });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(container.querySelector(".banner.alarm")).not.toBeNull();
    expect(screen.getByText(severityWord("alarm"))).toBeInTheDocument();
  });
});
