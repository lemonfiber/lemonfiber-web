import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Action from "./Action.svelte";
import { everyWeight } from "../lib/weight";

const words = "Fix it for me";

describe("Action", () => {
  it("is named by the words on it", () => {
    render(Action, { label: words });
    expect(screen.getByRole("button", { name: words })).toBeInTheDocument();
  });

  it("does the thing it was given to do", async () => {
    const pressed = vi.fn();
    render(Action, { label: words, onclick: pressed });

    await userEvent.click(screen.getByRole("button", { name: words }));

    expect(pressed).toHaveBeenCalledOnce();
  });

  it("stays where it is when it was given nothing to do", async () => {
    render(Action, { label: words });

    await userEvent.click(screen.getByRole("button", { name: words }));

    expect(screen.getByRole("button", { name: words })).toBeInTheDocument();
  });

  // No action may require a pointing device, so the one control that carries
  // every action has to be reachable and pressable without one.
  it("is reached and pressed by the keyboard alone", async () => {
    const pressed = vi.fn();
    render(Action, { label: words, onclick: pressed });

    await userEvent.tab();
    expect(screen.getByRole("button", { name: words })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(pressed).toHaveBeenCalledTimes(2);
  });

  // A control inside a form defaults to submitting it, which is a second
  // thing pressed by accident.
  it("submits no form it happens to be standing in", () => {
    render(Action, { label: words });
    expect(screen.getByRole("button", { name: words })).toHaveAttribute(
      "type",
      "button",
    );
  });

  // One control completes a form, and it is the one that says it does. That is
  // also what makes the enter key finish what was typed.
  it("completes the form it stands in where it says it does", () => {
    render(Action, { label: words, submits: true });
    expect(screen.getByRole("button", { name: words })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});

describe("a control with nothing to do for the moment", () => {
  it("does not do the thing it was given when it is pressed", async () => {
    const pressed = vi.fn();
    render(Action, { label: words, off: true, onclick: pressed });

    await userEvent.click(screen.getByRole("button", { name: words }));

    expect(pressed).not.toHaveBeenCalled();
  });

  // `aria-disabled` is a word to a reader and not a brake, so a control that
  // completes a form has to be stopped from completing it as well.
  it("completes no form while there is nothing to do", async () => {
    const sent = vi.fn();
    const { container } = render(Action, {
      label: words,
      off: true,
      submits: true,
    });
    const form = document.createElement("form");
    form.addEventListener("submit", sent);
    const button = screen.getByRole("button", { name: words });
    form.append(button);
    container.append(form);

    await userEvent.click(screen.getByRole("button", { name: words }));

    expect(sent).not.toHaveBeenCalled();
  });

  it("says so where a reader is told rather than only shown", () => {
    render(Action, { label: words, off: true });
    expect(screen.getByRole("button", { name: words })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  // `disabled` takes a button out of the tab order, and a reader whose focus
  // was on the button they just pressed would be left standing nowhere.
  it("stays somewhere focus can be", async () => {
    render(Action, { label: words, off: true });

    await userEvent.tab();

    expect(screen.getByRole("button", { name: words })).toHaveFocus();
  });

  it("is pressable again once there is something to do", async () => {
    const pressed = vi.fn();
    const { rerender } = render(Action, {
      label: words,
      off: true,
      onclick: pressed,
    });

    await rerender({ off: false });
    await userEvent.click(screen.getByRole("button", { name: words }));

    expect(pressed).toHaveBeenCalledOnce();
  });
});

describe("how much a control insists", () => {
  it("is offered rather than asked for unless it is told otherwise", () => {
    const { container } = render(Action, { label: words });
    expect(container.querySelector(".act.firm")).toBeNull();
  });

  it.each(everyWeight)("records the weight %s it carries", (weight) => {
    const { container } = render(Action, { label: words, weight });
    expect(container.querySelector(".act")?.classList.contains("firm")).toBe(
      weight === "firm",
    );
  });
});

describe("when a control's weight changes while it is on screen", () => {
  it("takes the weight on without losing its words", async () => {
    const { container, rerender } = render(Action, { label: words });
    expect(container.querySelector(".act.firm")).toBeNull();

    await rerender({ weight: "firm" });

    expect(container.querySelector(".act.firm")).not.toBeNull();
    expect(screen.getByRole("button", { name: words })).toBeInTheDocument();
  });
});
