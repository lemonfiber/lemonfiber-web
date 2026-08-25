import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FormRow from "./FormRow.svelte";
import * as m from "../paraglide/messages.js";

const name = "Media";
const description = "Your library, and what serves it to the household.";

const row = (over: Partial<Record<string, unknown>> = {}): void => {
  render(FormRow, {
    name,
    description,
    composable: true,
    chosen: false,
    ...over,
  });
};

describe("one form the stack declares", () => {
  // The words are the manifest's own: a stack of somebody's own names and
  // describes its forms however it likes.
  it("says what the stack calls it, and what the stack says it is for", () => {
    row();

    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("says it can run alongside another form", () => {
    row();

    expect(screen.getByText(m.form_alongside())).toBeInTheDocument();
  });

  it("says it cannot", () => {
    row({ composable: false });

    expect(screen.getByText(m.form_alone())).toBeInTheDocument();
  });
});

describe("taking a form up", () => {
  // A reader listing the controls on a screen is given the names and nothing
  // around them, so each names the form it takes up.
  it("names the form on the control that takes it up", () => {
    row();

    expect(
      screen.getByRole("button", { name: m.forms_choose({ name }) }),
    ).toBeInTheDocument();
  });

  it("says whether it has been taken up", () => {
    row({ chosen: true });

    expect(
      screen.getByRole("button", { name: m.forms_choose({ name }) }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("asks for the other position when it is pressed", async () => {
    const chose = vi.fn();
    row({ onchoose: chose });

    await userEvent.click(
      screen.getByRole("button", { name: m.forms_choose({ name }) }),
    );

    expect(chose).toHaveBeenCalledOnce();
  });

  // It shows the position it was told to show. The screen that owns the
  // choice is the one that finds out whether the change took.
  it("does not move itself", async () => {
    row();

    await userEvent.click(
      screen.getByRole("button", { name: m.forms_choose({ name }) }),
    );

    expect(
      screen.getByRole("button", { name: m.forms_choose({ name }) }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
