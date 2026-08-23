import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import DeadNote from "./DeadNote.svelte";
import * as m from "../paraglide/messages.js";

const actions = createRawSnippet(() => ({
  render: () => `<button type="button">Try again</button>`,
}));

const service = "Prowlarr";

describe("DeadNote", () => {
  it("names the source that stopped answering", () => {
    render(DeadNote, { service });
    expect(
      screen.getByText(m.panel_dead_source({ service })),
    ).toBeInTheDocument();
  });

  // Told a figure cannot be trusted and not which ones, an operator has to
  // distrust the whole screen.
  it("says how far the damage reaches", () => {
    render(DeadNote, { service });
    expect(screen.getByText(m.panel_dead_scope())).toBeInTheDocument();
  });

  it("offers the actions it was given", () => {
    render(DeadNote, { service, actions });
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("offers nothing where there is nothing to press", () => {
    const { container } = render(DeadNote, { service });
    expect(container.querySelector(".acts")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  // The words beside it already say it; announcing the drawing says it twice.
  it("hides its drawing from a screen reader", () => {
    const { container } = render(DeadNote, { service });
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("when the source a panel names changes", () => {
  it("names the new one without being remounted", async () => {
    const { rerender } = render(DeadNote, { service });
    await rerender({ service: "SABnzbd" });

    expect(
      screen.getByText(m.panel_dead_source({ service: "SABnzbd" })),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.panel_dead_source({ service }))).toBeNull();
  });
});
