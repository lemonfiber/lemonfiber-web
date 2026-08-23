import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Avatar from "./Avatar.svelte";

describe("Avatar", () => {
  it("draws the first letter of the name it stands for", () => {
    render(Avatar, { name: "Nora" });
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("draws that letter as a capital, whatever the name was given as", () => {
    render(Avatar, { name: "wessel" });
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("takes the first letter of the name, not the space before it", () => {
    render(Avatar, { name: "  Sam" });
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  // The name is written beside the tile everywhere this appears, and a letter
  // read out as well is a letter a screen reader cannot expand.
  it("keeps the tile out of the reading", () => {
    render(Avatar, { name: "Nora" });
    expect(screen.getByText("N")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("how much room a tile takes", () => {
  it("takes the row-sized tile unless it is told otherwise", () => {
    const { container } = render(Avatar, { name: "Nora" });
    expect(container.querySelector(".avatar.small")).toBeNull();
  });

  it("takes the header-sized tile when it is asked for", () => {
    const { container } = render(Avatar, { name: "Nora", small: true });
    expect(container.querySelector(".avatar.small")).not.toBeNull();
  });
});

describe("when a tile is given a different person", () => {
  it("draws their initial instead", async () => {
    const { rerender } = render(Avatar, { name: "Nora" });
    expect(screen.getByText("N")).toBeInTheDocument();

    await rerender({ name: "Guest" });

    expect(screen.queryByText("N")).toBeNull();
    expect(screen.getByText("G")).toBeInTheDocument();
  });
});
