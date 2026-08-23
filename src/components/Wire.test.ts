import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Wire from "./Wire.svelte";

describe("Wire", () => {
  it("says what it means where the arrow is drawn", () => {
    render(Wire, { label: "carries" });
    expect(screen.getByText("carries")).toBeInTheDocument();
  });

  it("says nothing where the boxes it joins already read as one sentence", () => {
    const { container } = render(Wire, {});
    expect(container.querySelector(".said")).toBeNull();
  });

  // The word is the arrow written out, so a reader given both is given the
  // same fact twice.
  it("keeps the drawing out of the reading", () => {
    const { container } = render(Wire, { label: "carries" });
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("draws a route nothing is taking as a broken line", () => {
    const { container } = render(Wire, { label: "carries", quiet: true });
    expect(container.querySelector(".wire.quiet")).not.toBeNull();
  });

  it("draws a route that is carrying as a solid one", () => {
    const { container } = render(Wire, { label: "carries" });
    expect(container.querySelector(".wire.quiet")).toBeNull();
  });
});

describe("when a route falls quiet while it is on screen", () => {
  it("breaks its line and changes what it says together", async () => {
    const { container, rerender } = render(Wire, { label: "carries" });
    expect(container.querySelector(".wire.quiet")).toBeNull();

    await rerender({ label: "carries nothing", quiet: true });

    expect(container.querySelector(".wire.quiet")).not.toBeNull();
    expect(screen.getByText("carries nothing")).toBeInTheDocument();
  });
});
