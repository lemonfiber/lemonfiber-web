import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Swatch from "./Swatch.svelte";

const lemon = { name: "Lemon", token: "--lemon" };

describe("Swatch", () => {
  it("says what the colour is called", () => {
    render(Swatch, lemon);
    expect(screen.getByRole("figure")).toHaveTextContent("Lemon");
  });

  it("prints the token that names the colour", () => {
    render(Swatch, lemon);
    expect(screen.getByText("--lemon")).toBeInTheDocument();
  });

  it("draws the chip from the token rather than from a copy of its value", () => {
    const { container } = render(Swatch, lemon);
    expect(container.querySelector(".chip")).toHaveStyle({
      background: "var(--lemon)",
    });
  });

  it("keeps the block of colour out of the reading", () => {
    const { container } = render(Swatch, lemon);
    expect(container.querySelector(".chip")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("leaves the words beside it to be read as they are", () => {
    render(Swatch, lemon);
    expect(screen.getByRole("figure")).not.toHaveAttribute("aria-label");
  });
});

describe("when a swatch is pointed at another token", () => {
  it("takes that token's name, its words and its colour together", async () => {
    const { container, rerender } = render(Swatch, lemon);
    expect(container.querySelector(".chip")).toHaveStyle({
      background: "var(--lemon)",
    });

    await rerender({ name: "Needs you", token: "--alarm" });

    expect(screen.getByText("--alarm")).toBeInTheDocument();
    expect(screen.getByText("Needs you")).toBeInTheDocument();
    expect(container.querySelector(".chip")).toHaveStyle({
      background: "var(--alarm)",
    });
  });
});
