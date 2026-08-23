import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Treemap from "./Treemap.svelte";
import { everyGround, type Block } from "../lib/ground";

const label = "Where your space went";

const space: readonly Block[] = [
  { name: "Downloads", value: "548 GB", share: 0.13, ground: "other" },
  { name: "Films", value: "2.1 TB · 58%", share: 0.58, ground: "biggest" },
  { name: "Other", value: "28 GB", share: 0.01, ground: "other" },
  { name: "Series", value: "960 GB", share: 0.24, ground: "next" },
  { name: "Free", value: "412 GB", share: 0.1, ground: "free" },
];

const namesIn = (container: Element): (string | null)[] =>
  [...container.querySelectorAll(".name")].map((node) => node.textContent);

describe("Treemap", () => {
  it("gives the whole map a name to be announced by", () => {
    render(Treemap, { label, blocks: space });
    expect(screen.getByRole("list", { name: label })).toBeInTheDocument();
  });

  it("draws one block per share of the whole", () => {
    render(Treemap, { label, blocks: space });
    expect(screen.getAllByRole("listitem").length).toBe(space.length);
  });

  it("says every block's name in words", () => {
    render(Treemap, { label, blocks: space });
    for (const block of space) {
      expect(screen.getByText(block.name)).toBeInTheDocument();
    }
  });

  it("says every block's amount in words", () => {
    render(Treemap, { label, blocks: space });
    for (const block of space) {
      expect(screen.getByText(block.value)).toBeInTheDocument();
    }
  });
});

describe("the order a map is read in", () => {
  // Whatever order the blocks arrive in, the reading is the order of size —
  // which is the same thing the areas say, for a reader who has neither the
  // areas nor the colours.
  it("reads biggest first", () => {
    const { container } = render(Treemap, { label, blocks: space });
    expect(namesIn(container)).toEqual([
      "Films",
      "Series",
      "Downloads",
      "Free",
      "Other",
    ]);
  });

  it("draws the biggest share largest, and only that one", () => {
    const { container } = render(Treemap, { label, blocks: space });
    expect(container.querySelector(".tm")).toHaveClass("tall");
    expect(container.querySelectorAll(".tall").length).toBe(1);
  });
});

describe("the ground a block takes", () => {
  it.each(everyGround)("sets a %s block on its own ground", (ground) => {
    const { container } = render(Treemap, {
      label,
      blocks: [{ name: "Films", value: "2.1 TB", share: 0.58, ground }],
    });
    expect(container.querySelector(`.tm.${ground}`)).not.toBeNull();
  });

  it("keeps the space nothing is using on the page's own ground", () => {
    const { container } = render(Treemap, { label, blocks: space });
    expect(container.querySelector(".tm.free")).toHaveTextContent("412 GB");
  });
});

describe("when a share changes under a map already on screen", () => {
  it("moves the block that has taken the lead", async () => {
    const { container, rerender } = render(Treemap, { label, blocks: space });
    expect(namesIn(container)[0]).toBe("Films");

    await rerender({
      blocks: space.map((block) =>
        block.name === "Series" ? { ...block, share: 0.7 } : block,
      ),
    });

    expect(namesIn(container)[0]).toBe("Series");
    expect(container.querySelector(".tm")).toHaveClass("tall", "next");
  });
});
