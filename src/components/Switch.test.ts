import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Switch from "./Switch.svelte";

const governs = "Start when this machine starts";

describe("Switch", () => {
  it("is named by the setting beside it", () => {
    render(Switch, { on: false, label: governs });
    expect(screen.getByRole("button", { name: governs })).toBeInTheDocument();
  });

  it("announces that it is on", () => {
    render(Switch, { on: true, label: governs });
    expect(
      screen.getByRole("button", { name: governs, pressed: true }),
    ).toBeInTheDocument();
  });

  it("announces that it is off", () => {
    render(Switch, { on: false, label: governs });
    expect(
      screen.getByRole("button", { name: governs, pressed: false }),
    ).toBeInTheDocument();
  });

  it("asks for the other position when it is pressed", async () => {
    const asked = vi.fn();
    render(Switch, { on: false, label: governs, onclick: asked });

    await userEvent.click(screen.getByRole("button", { name: governs }));

    expect(asked).toHaveBeenCalledOnce();
  });

  // No setting may require a pointing device to change.
  it("is reached and flipped by the keyboard alone", async () => {
    const asked = vi.fn();
    render(Switch, { on: false, label: governs, onclick: asked });

    await userEvent.tab();
    expect(screen.getByRole("button", { name: governs })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(asked).toHaveBeenCalledTimes(2);
  });

  // It shows the position it was told to show, and the screen that owns the
  // setting is the one that changes it.
  it("stays in its position when it was given nothing to ask", async () => {
    render(Switch, { on: false, label: governs });

    await userEvent.click(screen.getByRole("button", { name: governs }));

    expect(
      screen.getByRole("button", { name: governs, pressed: false }),
    ).toBeInTheDocument();
  });

  // A control inside a form defaults to submitting it, which is a second
  // thing pressed by accident.
  it("submits no form it happens to be standing in", () => {
    render(Switch, { on: true, label: governs });
    expect(screen.getByRole("button", { name: governs })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("when a setting is turned somewhere else", () => {
  it("takes the position it is told to, keeping the name it is known by", async () => {
    const { rerender } = render(Switch, { on: false, label: governs });
    expect(
      screen.getByRole("button", { name: governs, pressed: false }),
    ).toBeInTheDocument();

    await rerender({ on: true });

    expect(
      screen.getByRole("button", { name: governs, pressed: true }),
    ).toBeInTheDocument();
  });
});
