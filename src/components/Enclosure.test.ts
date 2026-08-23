import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Enclosure from "./Enclosure.svelte";

const parts = createRawSnippet(() => ({
  render: () => `<p data-testid="part">gluetun</p>`,
}));

describe("Enclosure", () => {
  it("names the box by the words on its border", () => {
    render(Enclosure, { label: "The tunnel", children: parts });
    expect(
      screen.getByRole("region", { name: "The tunnel" }),
    ).toBeInTheDocument();
  });

  // What the diagram claims is containment, so the parts are inside the thing
  // that names them rather than beside it.
  it("puts what it holds inside the box that names it", () => {
    render(Enclosure, { label: "The tunnel", children: parts });
    const box = screen.getByRole("region", { name: "The tunnel" });
    expect(box.querySelector("[data-testid='part']")).not.toBeNull();
  });

  it("shows the words on the border as well as saying them", () => {
    render(Enclosure, { label: "The tunnel", children: parts });
    expect(screen.getByText("The tunnel")).toBeInTheDocument();
  });

  it("claims nothing about parts that nothing holds", () => {
    render(Enclosure, { children: parts });
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.getByTestId("part")).toBeInTheDocument();
  });

  it("draws no box around a grouping", () => {
    const { container } = render(Enclosure, { children: parts });
    expect(container.querySelector(".encl.bare")).not.toBeNull();
  });

  it("draws the box that holds something", () => {
    const { container } = render(Enclosure, {
      label: "One disk",
      children: parts,
    });
    expect(container.querySelector(".encl.bare")).toBeNull();
  });

  it("runs its parts across unless told to stack them", () => {
    const { container } = render(Enclosure, {
      label: "One disk",
      children: parts,
    });
    expect(container.querySelector(".encl.column")).toBeNull();
  });

  it("stacks its parts when told to", () => {
    const { container } = render(Enclosure, {
      label: "One disk",
      column: true,
      children: parts,
    });
    expect(container.querySelector(".encl.column")).not.toBeNull();
  });
});

describe("when a grouping is given words while it is on screen", () => {
  it("takes the name and the border together", async () => {
    const { container, rerender } = render(Enclosure, { children: parts });
    expect(screen.queryByRole("region")).toBeNull();

    await rerender({ label: "The tunnel" });

    expect(
      screen.getByRole("region", { name: "The tunnel" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".encl.bare")).toBeNull();
  });
});
