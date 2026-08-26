import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Unlock from "./Unlock.svelte";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");

describe("Unlock", () => {
  it("says what it needs and where the operator saw it", () => {
    render(Unlock, { onopen: vi.fn() });
    expect(
      screen.getByRole("heading", { level: 1, name: m.unlock_title() }),
    ).toBeInTheDocument();
    expect(screen.getByText(m.unlock_prose())).toBeInTheDocument();
    expect(screen.getByText(m.unlock_hint())).toBeInTheDocument();
  });

  it("hands over the key it was given", async () => {
    const opened = vi.fn();
    render(Unlock, { onopen: opened });

    await userEvent.type(
      screen.getByRole("textbox", { name: m.unlock_label() }),
      key,
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).toHaveBeenCalledWith(key);
  });

  // A key is copied off a terminal, and what comes with it is whitespace.
  it("drops what was pasted around it", async () => {
    const opened = vi.fn();
    render(Unlock, { onopen: opened });

    await userEvent.type(
      screen.getByRole("textbox", { name: m.unlock_label() }),
      `  ${key}  `,
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).toHaveBeenCalledWith(key);
  });

  // Which of the two reasons this screen is here is what it says, and one of
  // them is the only account a reader gets of a console that vanished.
  it("says a run refused the key where that is why it is here", () => {
    render(Unlock, { onopen: vi.fn(), refused: true });

    expect(screen.getByRole("alert")).toHaveTextContent(
      m.unlock_refused_lead(),
    );
    expect(screen.getByText(m.unlock_refused_prose())).toBeInTheDocument();
  });

  it("says nothing of the sort where nothing was refused", () => {
    render(Unlock, { onopen: vi.fn() });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("asks for nothing on an empty box", async () => {
    const opened = vi.fn();
    render(Unlock, { onopen: opened });

    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).not.toHaveBeenCalled();
  });
});
