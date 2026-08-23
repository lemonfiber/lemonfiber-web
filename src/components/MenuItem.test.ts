import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import MenuItem from "./MenuItem.svelte";
import { drawings } from "../lib/icons";

const overview = {
  href: "/overview",
  icon: "overview",
  label: "Overview",
} as const;

/** How many parts the drawing on this row is built from. */
function shapesIn(container: Element): number {
  return container.querySelectorAll("svg > *").length;
}

describe("MenuItem", () => {
  it("is named by the screen it goes to", () => {
    render(MenuItem, overview);
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
  });

  it("goes to the address it was pointed at", () => {
    render(MenuItem, overview);
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/overview",
    );
  });

  it("is named by the screen and how many things are waiting there", () => {
    render(MenuItem, { ...overview, tally: "3" });
    expect(
      screen.getByRole("link", { name: "Overview 3" }),
    ).toBeInTheDocument();
  });

  it("says this is the screen being read", () => {
    render(MenuItem, { ...overview, current: true });
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  // Exactly one row in a menu may make that claim.
  it("claims nothing about a screen that is not being read", () => {
    render(MenuItem, overview);
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("says how many things are waiting there", () => {
    render(MenuItem, { ...overview, tally: "3" });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("says nothing where nothing is waiting", () => {
    const { container } = render(MenuItem, overview);
    expect(container.querySelector(".tally")).toBeNull();
  });

  it("marks a tally that wants the operator now", () => {
    const { container } = render(MenuItem, {
      ...overview,
      tally: "1",
      urgent: true,
    });
    expect(container.querySelector(".tally")?.classList.contains("hot")).toBe(
      true,
    );
  });

  it("leaves a tally that wants nothing quiet", () => {
    const { container } = render(MenuItem, { ...overview, tally: "3" });
    expect(container.querySelector(".tally")?.classList.contains("hot")).toBe(
      false,
    );
  });

  it("draws the icon it was named", () => {
    const { container } = render(MenuItem, { ...overview, icon: "checks" });
    expect(shapesIn(container)).toBe(drawings.checks.length);
  });

  // The name beside the drawing already says what it means.
  it("leaves the drawing unannounced", () => {
    const { container } = render(MenuItem, overview);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("when the screen being read changes", () => {
  it("hands the claim over without being remounted", async () => {
    const { rerender } = render(MenuItem, { ...overview, current: true });
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await rerender({ current: false });

    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("follows the count and the severity behind it", async () => {
    const { container, rerender } = render(MenuItem, {
      ...overview,
      tally: "3",
    });
    expect(container.querySelector(".tally")?.classList.contains("hot")).toBe(
      false,
    );

    await rerender({ tally: "1", urgent: true });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(container.querySelector(".tally")?.classList.contains("hot")).toBe(
      true,
    );
  });
});
