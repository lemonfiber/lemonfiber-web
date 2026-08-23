import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CheckLine from "./CheckLine.svelte";

const kind = "Problems";

/** The box the tick sits in, whichever position the line is in. */
function boxIn(container: Element): Element | null {
  return container.querySelector(".box");
}

describe("CheckLine", () => {
  it("is named by what it selects", () => {
    render(CheckLine, { on: true, label: kind });
    expect(screen.getByRole("button", { name: kind })).toBeInTheDocument();
  });

  it("is named by what it selects and how much of it there is", () => {
    render(CheckLine, { on: true, label: kind, count: "42" });
    expect(
      screen.getByRole("button", { name: "Problems 42" }),
    ).toBeInTheDocument();
  });

  it("announces that lines of this kind are shown", () => {
    render(CheckLine, { on: true, label: kind });
    expect(
      screen.getByRole("button", { name: kind, pressed: true }),
    ).toBeInTheDocument();
  });

  it("announces that they are not", () => {
    render(CheckLine, { on: false, label: kind });
    expect(
      screen.getByRole("button", { name: kind, pressed: false }),
    ).toBeInTheDocument();
  });

  it("says how many lines it holds", () => {
    render(CheckLine, { on: false, label: "Chatter", count: "318" });
    expect(screen.getByText("318")).toBeInTheDocument();
  });

  it("says nothing about a count where nothing counts them", () => {
    const { container } = render(CheckLine, { on: true, label: "Last hour" });
    expect(container.querySelector(".n")).toBeNull();
  });

  // The position is a shape as well as a colour, so it survives greyscale.
  it("ticks the box of a kind that is shown", () => {
    const { container } = render(CheckLine, { on: true, label: kind });
    expect(boxIn(container)?.querySelector("svg")).not.toBeNull();
  });

  it("leaves the box of a kind that is not empty", () => {
    const { container } = render(CheckLine, { on: false, label: kind });
    expect(boxIn(container)?.querySelector("svg")).toBeNull();
  });

  // The words beside the tick already say what it means.
  it("leaves the tick unannounced", () => {
    const { container } = render(CheckLine, { on: true, label: kind });
    expect(boxIn(container)?.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("asks for the other position when it is pressed", async () => {
    const asked = vi.fn();
    render(CheckLine, { on: true, label: kind, onclick: asked });

    await userEvent.click(screen.getByRole("button", { name: kind }));

    expect(asked).toHaveBeenCalledOnce();
  });

  // No filter may require a pointing device to change.
  it("is reached and pressed by the keyboard alone", async () => {
    const asked = vi.fn();
    render(CheckLine, { on: false, label: kind, onclick: asked });

    await userEvent.tab();
    expect(screen.getByRole("button", { name: kind })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(asked).toHaveBeenCalledTimes(2);
  });

  // It shows the position it was told to show, and the screen that owns the
  // filter is the one that changes it.
  it("stays in its position when it was given nothing to ask", async () => {
    render(CheckLine, { on: true, label: kind });

    await userEvent.click(screen.getByRole("button", { name: kind }));

    expect(
      screen.getByRole("button", { name: kind, pressed: true }),
    ).toBeInTheDocument();
  });

  // A control inside a form defaults to submitting it, which is a second
  // thing pressed by accident.
  it("submits no form it happens to be standing in", () => {
    render(CheckLine, { on: true, label: kind });
    expect(screen.getByRole("button", { name: kind })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("when a filter is changed somewhere else", () => {
  it("takes the position it is told to, tick and all", async () => {
    const { container, rerender } = render(CheckLine, {
      on: false,
      label: kind,
      count: "1",
    });
    expect(boxIn(container)?.querySelector("svg")).toBeNull();

    await rerender({ on: true });

    expect(
      screen.getByRole("button", { name: "Problems 1", pressed: true }),
    ).toBeInTheDocument();
    expect(boxIn(container)?.querySelector("svg")).not.toBeNull();
  });

  it("drops the count when nothing counts them any more", async () => {
    const { container, rerender } = render(CheckLine, {
      on: true,
      label: kind,
      count: "1",
    });
    expect(container.querySelector(".n")).not.toBeNull();

    await rerender({ count: undefined });

    expect(container.querySelector(".n")).toBeNull();
    expect(screen.getByRole("button", { name: kind })).toBeInTheDocument();
  });
});
