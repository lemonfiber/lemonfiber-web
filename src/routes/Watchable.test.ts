import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi, type Mock } from "vitest";
import Watchable from "./panels/Watchable.svelte";
import { kitsShelf } from "../api/shelves";
import type { Shelving } from "./shelving";
import { holdingLine } from "../lib/watchable";
import type { Shelf } from "../lib/yours";
import * as m from "../paraglide/messages.js";

/** Kit's shelf control, answering each asking with what it is given. */
function drawn(...answers: Reading<Shelf>[]): Mock<Shelving> {
  const shelving = vi.fn<Shelving>(() =>
    Promise.resolve(answers.shift() ?? { ok: true, value: kitsShelf }),
  );
  render(Watchable, { name: "Kit", shelving });
  return shelving;
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("what one member can watch", () => {
  it("is asked only when opened, and lists every title", async () => {
    const shelving = drawn();
    expect(shelving).not.toHaveBeenCalled();

    await press(m.action_shelf({ name: "Kit" }));
    expect(shelving).toHaveBeenCalledWith("Kit");
    const listed = await screen.findByRole("list", {
      name: m.watch_said({ name: "Kit" }),
    });
    for (const holding of kitsShelf.holdings) {
      expect(listed).toHaveTextContent(holdingLine(holding));
    }
    expect(screen.getByText(kitsShelf.findings[0] ?? "")).toBeVisible();
  });

  it("holds a place while it is being asked", async () => {
    const shelving = vi.fn(() => new Promise<Reading<Shelf>>(() => undefined));
    render(Watchable, { name: "Kit", shelving });
    await press(m.action_shelf({ name: "Kit" }));
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("closes, and asks afresh when opened again", async () => {
    const shelving = drawn();
    await press(m.action_shelf({ name: "Kit" }));
    await screen.findByRole("list");
    await press(m.action_shelf_close({ name: "Kit" }));
    expect(screen.queryByRole("list")).toBeNull();

    await press(m.action_shelf({ name: "Kit" }));
    await screen.findByRole("list");
    expect(shelving).toHaveBeenCalledTimes(2);
  });

  it("says nothing is listed where the shelf is empty", async () => {
    drawn({ ok: true, value: { ...kitsShelf, holdings: [], findings: [] } });
    await press(m.action_shelf({ name: "Kit" }));
    expect(
      await screen.findByText(m.watch_none({ name: "Kit" })),
    ).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("says why it could not be read", async () => {
    drawn({ ok: false, problem: { kind: "refused", message: "No." } });
    await press(m.action_shelf({ name: "Kit" }));
    expect(await screen.findByText("No.")).toBeVisible();
  });
});
