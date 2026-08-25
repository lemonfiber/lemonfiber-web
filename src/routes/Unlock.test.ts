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

  it("asks for nothing on an empty box", async () => {
    const opened = vi.fn();
    render(Unlock, { onopen: opened });

    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).not.toHaveBeenCalled();
  });
});
