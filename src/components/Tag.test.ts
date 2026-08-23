import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Tag from "./Tag.svelte";
import { everyState, everyTone, toneFor } from "../lib/state";

const mark = createRawSnippet(() => ({
  render: () => `<i data-mark="true"></i>`,
}));

/** The tag itself, whatever ground it took. */
function tagIn(container: Element): Element | null {
  return container.querySelector(".tag");
}

describe("Tag", () => {
  it("shows the words it was given", () => {
    render(Tag, { label: "torrent" });
    expect(screen.getByText("torrent")).toBeInTheDocument();
  });

  it("shows a figure as readily as a word", () => {
    render(Tag, { label: "+5 more" });
    expect(screen.getByText("+5 more")).toBeInTheDocument();
  });

  it("puts the mark before the words", () => {
    const { container } = render(Tag, { label: "sonarr", children: mark });
    const tag = tagIn(container);
    expect(tag?.firstElementChild).toHaveAttribute("data-mark", "true");
    expect(tag?.lastElementChild).toHaveTextContent("sonarr");
  });

  it("carries the words alone where there is no mark", () => {
    const { container } = render(Tag, { label: "usenet" });
    expect(container.querySelector("[data-mark]")).toBeNull();
    expect(tagIn(container)).toHaveTextContent("usenet");
  });
});

describe("the ground a tag takes", () => {
  // A third of the tags on the screen name a thing rather than a state, and a
  // filled ground would lend a plain label the weight of one.
  it("takes no ground at all when it carries no severity", () => {
    const { container } = render(Tag, { label: "torrent" });
    expect(tagIn(container)?.classList.contains("bare")).toBe(true);
  });

  it.each(everyTone)("keeps the ground quiet unless %s wants you", (tone) => {
    const { container } = render(Tag, { label: "Working", tone });
    const tag = tagIn(container);
    expect(tag?.classList.contains("watch")).toBe(tone === "watch");
    expect(tag?.classList.contains("alarm")).toBe(tone === "alarm");
  });

  // A working service reads as a plain tag: the mark carries the green, so
  // eight of them are not a wall of it.
  it("draws a calm tag as a plain one", () => {
    const { container } = render(Tag, { label: "Working", tone: "calm" });
    const tag = tagIn(container);
    expect(tag?.classList.contains("bare")).toBe(false);
    expect(tag?.classList.contains("watch")).toBe(false);
    expect(tag?.classList.contains("alarm")).toBe(false);
  });
});

describe("what a tag stands for", () => {
  it.each(everyState)("records the state %s it was given", (state) => {
    const { container } = render(Tag, { label: "gluetun", state });
    expect(tagIn(container)).toHaveAttribute("data-state", state);
  });

  it("records nothing where the tag names a thing", () => {
    const { container } = render(Tag, { label: "torrent" });
    expect(tagIn(container)).not.toHaveAttribute("data-state");
  });

  // Ground and state are set apart: a plain tag can stand for a state, and a
  // tinted one can stand for none.
  it("takes a ground without a state behind it", () => {
    const { container } = render(Tag, { label: "Problem", tone: "alarm" });
    const tag = tagIn(container);
    expect(tag?.classList.contains("alarm")).toBe(true);
    expect(tag).not.toHaveAttribute("data-state");
  });

  it("stands for a state without taking a ground", () => {
    const { container } = render(Tag, {
      label: "Never measured",
      state: "unknown",
    });
    const tag = tagIn(container);
    expect(tag?.classList.contains("bare")).toBe(true);
    expect(tag).toHaveAttribute("data-state", "unknown");
  });
});

describe("when a tag already on screen changes", () => {
  it("takes the new ground without being remounted", async () => {
    const { container, rerender } = render(Tag, {
      label: "Working",
      tone: toneFor("known"),
    });
    expect(tagIn(container)?.classList.contains("alarm")).toBe(false);

    await rerender({ label: "Stopped", tone: toneFor("stopped") });

    expect(tagIn(container)?.classList.contains("alarm")).toBe(true);
    expect(screen.getByText("Stopped")).toBeInTheDocument();
    expect(screen.queryByText("Working")).toBeNull();
  });

  it("drops its ground when the severity goes away", async () => {
    const { container, rerender } = render(Tag, {
      label: "Warning",
      tone: "watch",
    });
    expect(tagIn(container)?.classList.contains("watch")).toBe(true);

    await rerender({ tone: undefined });

    expect(tagIn(container)?.classList.contains("watch")).toBe(false);
    expect(tagIn(container)?.classList.contains("bare")).toBe(true);
  });
});
