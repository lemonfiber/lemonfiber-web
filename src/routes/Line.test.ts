import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { declaredRecord, means, shared, sharer } from "./lined";
import type { Freshness } from "../lib/freshness";
import type { Shared } from "../lib/shared";
import type { Sharer } from "../lib/sharing";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the line read and declared from it. */
function sharing(
  over: Partial<Sharer> = {},
  line: Reading<Shared> | undefined = { ok: true, value: shared },
): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    line,
    sharer: { ...sharer, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_line() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.line_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const button = (label: string): HTMLElement =>
  screen.getByRole("button", { name: label });

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  await userEvent.type(box, text);
}

describe("how the line is shared, on the settings screen", () => {
  it("is not drawn where it was neither read nor can be declared", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(screen.queryByRole("region", { name: m.panel_line() })).toBeNull();
  });

  it("says where the line stands and what it means, in lemonfiber's words", () => {
    sharing();
    const said = within(panel()).getByRole("list", { name: m.line_said() });
    expect(within(said).getByText(m.line_scheduled_active())).toBeVisible();
    expect(within(said).getByText(means)).toBeVisible();
  });

  it("says why it could not be read, or that it has not answered yet", () => {
    sharing({}, { ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });

  it("holds a place while nothing has answered", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      sharer,
    });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("draws the reading alone where nothing can be declared", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      line: { ok: true, value: shared },
    });
    expect(screen.queryByRole("group", { name: m.line_declare() })).toBeNull();
  });
});

describe("declaring how the line is shared", () => {
  it("sends only the limits typed, as they were typed", async () => {
    const onask = vi.fn();
    sharing({ onask });
    expect(button(m.action_line_declare())).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await typeInto(m.line_down(), "50%");
    await typeInto(m.line_active(), "07:00-23:00");
    await press(m.action_line_declare());

    expect(onask).toHaveBeenCalledWith({
      doing: "bandwidth",
      declared: { down: "50%", active: "07:00-23:00" },
    });
    expect(asked()).toHaveFocus();
  });

  it("asks what happens at the cap only once a cap is typed", async () => {
    const onask = vi.fn();
    sharing({ onask });
    expect(screen.queryByRole("radiogroup")).toBeNull();

    await typeInto(m.line_up(), "20%");
    await typeInto(m.line_line(), "100Mbit/20Mbit");
    await typeInto(m.line_cap(), "500GB");
    await userEvent.click(
      screen.getByRole("radio", { name: m.line_exceeded_throttle() }),
    );
    await press(m.action_line_declare());

    expect(onask).toHaveBeenCalledWith({
      doing: "bandwidth",
      declared: {
        up: "20%",
        line: "100Mbit/20Mbit",
        cap: "500GB",
        exceeded: "throttle",
      },
    });
  });

  it("offers every answer to what happens at the cap", async () => {
    sharing();
    await typeInto(m.line_cap(), "500GB");
    for (const label of [
      m.line_exceeded_pause(),
      m.line_exceeded_throttle(),
      m.line_exceeded_continue(),
    ]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("lifts the limits for the minutes typed", async () => {
    const onask = vi.fn();
    sharing({ onask });

    await typeInto(m.line_minutes(), "30");
    await press(m.action_line_lift());

    expect(onask).toHaveBeenCalledWith({ doing: "bandwidth", minutes: 30 });
  });

  // A count lemonfiber would refuse for a reason already on the screen is not
  // sent, and the line under the box says what a count is.
  it("sends nothing while the minutes typed are not a count", async () => {
    const onask = vi.fn();
    sharing({ onask });

    await typeInto(m.line_minutes(), "soon");

    expect(button(m.action_line_lift())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(panel()).getByText(m.line_minutes_unread())).toBeVisible();
    expect(onask).not.toHaveBeenCalled();
  });

  it("keeps a record of what declaring came to", async () => {
    const ondrop = vi.fn();
    sharing({ work: [declaredRecord], ondrop });

    expect(within(asked()).getByText(m.doing_bandwidth_title())).toBeVisible();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(declaredRecord.id);
    expect(asked()).toHaveFocus();
  });

  it("is silenced while a request is in flight", async () => {
    sharing({ busy: true });
    await typeInto(m.line_down(), "50%");
    expect(button(m.action_line_declare())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("presses to nothing where nothing answers the controls", async () => {
    sharing({
      work: [
        {
          ...declaredRecord,
          id: "74",
          at: "under-way",
          job: "5c63",
        },
      ],
    });
    await press(m.action_hide_record());
    expect(within(asked()).getByText(m.doing_bandwidth_title())).toBeVisible();
  });
});
