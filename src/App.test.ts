import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import App from "./App.svelte";
import { everyState, wordFor } from "./lib/state";

describe("App", () => {
  it("names the product", () => {
    render(App);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "lemonfiber",
    );
  });

  it("shows every state the vocabulary has", () => {
    render(App);
    for (const state of everyState) {
      expect(screen.getByText(wordFor(state))).toBeInTheDocument();
    }
  });

  it("says plainly that it is unfinished", () => {
    render(App);
    expect(screen.getByText(/being built/i)).toBeInTheDocument();
  });
});
