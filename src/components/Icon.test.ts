import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Icon from "./Icon.svelte";
import { drawings, everyIcon, everyIconSize } from "../lib/icons";

/** The drawing inside an icon, with the whitespace the template adds removed. */
function drawing(container: Element): string {
  const svg = container.querySelector("svg");
  return (svg?.innerHTML ?? "").replaceAll(/\s+/g, " ").trim();
}

describe("Icon", () => {
  it.each(everyIcon)("draws every shape %s is built from", (name) => {
    const { container } = render(Icon, { name });
    expect(container.querySelector("svg")?.children).toHaveLength(
      drawings[name].length,
    );
  });

  it.each(everyIcon)("draws %s on the 24 grid the whole set shares", (name) => {
    const { container } = render(Icon, { name });
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
  });

  // Colour is the last thing a drawing says. Two names that draw the same
  // shape are two names for one icon.
  it("draws a different shape for every name", () => {
    const drawn = everyIcon.map((name) =>
      drawing(render(Icon, { name }).container),
    );
    expect(new Set(drawn).size).toBe(everyIcon.length);
    for (const d of drawn) expect(d).not.toBe("");
  });
});

describe("what a drawing is made of", () => {
  it("gives a path its own outline", () => {
    const { container } = render(Icon, { name: "tick" });
    expect(container.querySelector("path")).toHaveAttribute(
      "d",
      "M5 12.5l4.5 4.5L19 7",
    );
  });

  it("rounds the corners of a rectangle", () => {
    const { container } = render(Icon, { name: "system" });
    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "3");
    expect(rect).toHaveAttribute("y", "3");
    expect(rect).toHaveAttribute("width", "18");
    expect(rect).toHaveAttribute("height", "18");
    expect(rect).toHaveAttribute("rx", "2");
  });

  it("places a circle by its centre", () => {
    const { container } = render(Icon, { name: "info" });
    const circle = container.querySelector("circle");
    expect(circle).toHaveAttribute("cx", "12");
    expect(circle).toHaveAttribute("cy", "12");
    expect(circle).toHaveAttribute("r", "8.5");
  });

  it("turns the one drawing set on a diagonal", () => {
    const { container } = render(Icon, { name: "setup" });
    expect(container.querySelector("rect")).toHaveAttribute(
      "transform",
      "rotate(45 16.1 7.1)",
    );
  });

  it("breaks the edge of the drawing that means nothing is arriving", () => {
    const { container } = render(Icon, { name: "quiet" });
    expect(container.querySelector("rect")).toHaveAttribute(
      "stroke-dasharray",
      "3 3",
    );
  });

  it("leaves an upright, unbroken rectangle bare of both", () => {
    const { container } = render(Icon, { name: "storage" });
    const rect = container.querySelector("rect");
    expect(rect).not.toHaveAttribute("transform");
    expect(rect).not.toHaveAttribute("stroke-dasharray");
  });
});

describe("what a screen reader hears", () => {
  // Beside a label that already says it, a named drawing says it twice.
  it("says nothing when words beside it already do", () => {
    const { container } = render(Icon, { name: "alert" });
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("announces itself when it stands on its own", () => {
    const { container } = render(Icon, { name: "retry", label: "Try again" });
    expect(screen.getByRole("img", { name: "Try again" })).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toHaveAttribute("aria-hidden");
  });
});

describe("how much room a drawing takes", () => {
  it.each(everyIconSize)("sits at %s when asked for it", (size) => {
    const { container } = render(Icon, { name: "tick", size });
    expect(container.querySelector("svg")?.classList.contains("small")).toBe(
      size === "small",
    );
  });

  it("sits beside full-size words unless asked otherwise", () => {
    const { container } = render(Icon, { name: "tick" });
    expect(container.querySelector("svg")?.classList.contains("small")).toBe(
      false,
    );
  });
});

describe("when the drawing changes on an icon already on screen", () => {
  it("redraws without being remounted", async () => {
    const { container, rerender } = render(Icon, { name: "tick" });
    const tick = drawing(container);

    await rerender({ name: "alert" });

    expect(drawing(container)).not.toBe(tick);
    expect(drawing(container)).toBe(
      drawing(render(Icon, { name: "alert" }).container),
    );
  });

  it("takes a name up and puts one down when the shape count changes", async () => {
    const { container, rerender } = render(Icon, { name: "chev" });
    expect(container.querySelector("svg")?.children).toHaveLength(1);

    await rerender({ name: "services" });

    expect(container.querySelector("svg")?.children).toHaveLength(4);
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });
});
