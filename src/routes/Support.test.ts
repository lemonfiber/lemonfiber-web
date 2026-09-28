import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Checks from "./Checks.svelte";
import { allWell } from "./findings";
import { described, keeper, readBundle } from "./keeping";
import type { Freshness } from "../lib/freshness";
import { LOG_LINES, type Keeper } from "../lib/upkeep";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 6 };

/** The checks screen, with the support bundle at the end of it. */
function supporting(over: Partial<Keeper> = {}): void {
  render(Checks, {
    diagnosis: { ok: true, value: allWell },
    freshness: answered,
    keeper: { ...keeper, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_support() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.support_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const logs = (): HTMLElement => screen.getByLabelText(m.support_logs());

describe("gathering what somebody helping would need", () => {
  it("draws nothing where nothing answers it", () => {
    render(Checks, {
      diagnosis: { ok: true, value: allWell },
      freshness: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_support() }),
    ).toBeNull();
  });

  it("stands last on the checks screen", () => {
    supporting();
    expect(screen.getAllByRole("region").at(-1)).toBe(panel());
  });

  it("asks what a bundle would hold, on lemonfiber's own terms unless changed", async () => {
    const onask = vi.fn();
    supporting({ onask });
    expect(logs()).toHaveValue(String(LOG_LINES));

    await press(m.action_support_describe());

    expect(onask).toHaveBeenCalledWith({
      doing: "support",
      terms: { logs: LOG_LINES, filenames: false },
    });
  });

  it("asks on the terms chosen", async () => {
    const onask = vi.fn();
    supporting({ onask });

    await userEvent.clear(logs());
    await userEvent.type(logs(), "500");
    await userEvent.click(
      screen.getByRole("button", { name: m.support_filenames() }),
    );
    await press(m.action_support_describe());

    expect(onask).toHaveBeenCalledWith({
      doing: "support",
      terms: { logs: 500, filenames: true },
    });
  });

  it("is silenced while a request is in flight", () => {
    supporting({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_support_describe() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  // A count lemonfiber would refuse for a reason already on the screen is not
  // sent, and the line under the box says what a count is.
  it("sends nothing while the count typed is not one", async () => {
    const onask = vi.fn();
    supporting({ onask });

    await userEvent.clear(logs());
    await userEvent.type(logs(), "lots");
    await press(m.action_support_describe());

    expect(onask).not.toHaveBeenCalled();
    expect(
      within(panel()).getByText(m.support_logs_unread()),
    ).toBeInTheDocument();
  });
});

describe("a bundle described, before it is written", () => {
  it("shows every file it would hold, in full", () => {
    supporting({ work: [readBundle] });
    const [first] = described.contents.pieces;

    expect(
      within(asked()).getByRole("heading", { name: m.support_bundle_title() }),
    ).toBeInTheDocument();
    expect(
      within(asked()).getByText(first?.name ?? "missing"),
    ).toBeInTheDocument();
    expect(within(asked()).getByText(/Listening on 8989/u)).toBeInTheDocument();
  });

  // What is written is what was read, so the terms the description was read
  // under go with the yes, whatever the boxes above say now.
  it("writes it on the terms it was described under", async () => {
    const onask = vi.fn();
    supporting({ work: [readBundle], onask });

    await userEvent.clear(logs());
    await userEvent.type(logs(), "9");
    await press(m.action_support_write());

    expect(onask).toHaveBeenCalledWith({
      doing: "support",
      terms: { logs: 500, filenames: true },
      write: true,
    });
    expect(asked()).toHaveFocus();
  });

  it("puts the description away when it is left as it is", async () => {
    const ondrop = vi.fn();
    supporting({ work: [readBundle], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(readBundle.id);
    expect(asked()).toHaveFocus();
  });

  it("puts the record away when asked", async () => {
    const ondrop = vi.fn();
    supporting({ work: [readBundle], ondrop });

    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(readBundle.id);
  });
});
