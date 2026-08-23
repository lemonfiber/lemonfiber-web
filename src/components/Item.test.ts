import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Item from "./Item.svelte";
import { everyState, toneFor, wordFor } from "../lib/state";

const actions = createRawSnippet(() => ({
  render: () => `<button type="button">Fix it for me</button>`,
}));

const stuck = {
  state: "stopped",
  eyebrow: "Needs you",
  title: "A download is stuck, and won't try again on its own",
  prose:
    "It finished downloading but couldn't be filed into your library. It failed twice, so Sonarr gave up.",
} as const;

describe("Item", () => {
  it("heads the row with what happened", () => {
    render(Item, stuck);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      stuck.title,
    );
  });

  it("says the state in the row's own words", () => {
    render(Item, stuck);
    expect(screen.getByText(stuck.eyebrow)).toBeInTheDocument();
  });

  it("carries the prose that says what it means", () => {
    render(Item, stuck);
    expect(screen.getByText(stuck.prose)).toBeInTheDocument();
  });

  it("marks the row with the trust behind it", () => {
    render(Item, stuck);
    expect(
      screen.getByRole("img", { name: wordFor("stopped") }),
    ).toBeInTheDocument();
  });

  it("offers the actions it was given", () => {
    render(Item, { ...stuck, actions });
    expect(
      screen.getByRole("button", { name: "Fix it for me" }),
    ).toBeInTheDocument();
  });

  it("offers nothing where there is nothing to press", () => {
    const { container } = render(Item, stuck);
    expect(container.querySelector(".acts")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("the severity a row carries", () => {
  it.each(everyState)(
    "terminates %s in a port of its own severity",
    (state) => {
      const { container } = render(Item, { ...stuck, state });
      const tone = toneFor(state);
      expect(container.querySelector(".port")?.classList.contains(tone)).toBe(
        tone !== "calm",
      );
    },
  );

  // The eyebrow beside the port already says what the port means.
  it("leaves the port's drawing unannounced", () => {
    const { container } = render(Item, stuck);
    const drawings = container.querySelectorAll("svg[aria-hidden='true']");
    expect(drawings).toHaveLength(1);
  });

  it("tints only the row that wants you now", () => {
    const { container } = render(Item, { ...stuck, state: "known" });
    expect(container.querySelector(".item.alarm")).toBeNull();
  });

  it("tints the row that wants you now", () => {
    const { container } = render(Item, stuck);
    expect(container.querySelector(".item.alarm")).not.toBeNull();
  });
});

describe("when a row's state changes while it is on screen", () => {
  it("changes its mark and its port together", async () => {
    const { container, rerender } = render(Item, { ...stuck, state: "known" });
    expect(container.querySelector(".item.alarm")).toBeNull();

    await rerender({ state: "stopped" });

    expect(container.querySelector(".item.alarm")).not.toBeNull();
    expect(
      screen.getByRole("img", { name: wordFor("stopped") }),
    ).toBeInTheDocument();
  });
});
