import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Skeleton from "./Skeleton.svelte";

describe("Skeleton", () => {
  // The width is a ceiling: the bar stands as wide as the line it holds a place
  // for, and narrower where the column it sits in is narrower than that.
  it("holds the place at the width it was given, and no wider", () => {
    const { container } = render(Skeleton, { width: "260px" });
    expect(container.querySelector(".skel")).toHaveStyle({
      maxWidth: "260px",
    });
  });

  // A shape standing in for text is not text, and a reader told "graphic"
  // three times has been told nothing three times.
  it("keeps the bar out of the reading", () => {
    const { container } = render(Skeleton, { width: "64px" });
    expect(container.querySelector(".skel")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("says what has not arrived, as a status", () => {
    render(Skeleton, {
      width: "260px",
      label: "Waiting for the next line",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for the next line",
    );
  });

  it("says nothing for the other bars in a run", () => {
    render(Skeleton, { width: "88px" });
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("when the words for a bar already on screen change", () => {
  it("follows them, and follows a new width with them", async () => {
    const { container, rerender } = render(Skeleton, {
      width: "64px",
      label: "Waiting for the next line",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for the next line",
    );

    await rerender({ width: "260px", label: "Reading your library" });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Reading your library",
    );
    expect(container.querySelector(".skel")).toHaveStyle({
      maxWidth: "260px",
    });
  });
});
