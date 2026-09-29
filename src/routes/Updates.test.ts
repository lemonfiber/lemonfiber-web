import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { movedRecord, plan, planRecord, updater } from "./lined";
import type { Freshness } from "../lib/freshness";
import { stepLine } from "../lib/updated";
import type { Updater } from "../lib/updating";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the stack updated from it. */
function updating(over: Partial<Updater> = {}): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    updater: { ...updater, ...over },
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.updates_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("updating the stack from the settings screen", () => {
  it("is not drawn where nothing answers it", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(
      screen.queryByRole("region", { name: m.panel_updates() }),
    ).toBeNull();
  });

  it("reads what updating would change first, and moves nothing", async () => {
    const onask = vi.fn();
    updating({ onask });

    await press(m.action_update_plan());

    expect(onask).toHaveBeenCalledWith({ doing: "update" });
    expect(asked()).toHaveFocus();
  });

  it("lists every step before the yes", () => {
    updating({ work: [planRecord] });
    const shown = within(asked()).getByRole("region", {
      name: m.update_plan_title(),
    });
    for (const step of plan.changes) {
      expect(within(shown).getByText(stepLine(step))).toBeVisible();
    }
  });

  // The yes is the same request, confirmed, and it carries whether what is
  // still coming down is let finish first.
  it("moves on a yes under what was read, letting downloads finish where asked", async () => {
    const onask = vi.fn();
    updating({ work: [planRecord], onask });

    await press(m.update_wait());
    await press(m.action_update_yes());

    expect(onask).toHaveBeenCalledWith({
      doing: "update",
      confirm: true,
      wait: true,
    });
  });

  it("asks about downloads only where something is coming down", () => {
    const quiet = {
      ...planRecord,
      came: {
        kind: "update" as const,
        report: { ...plan, in_flight: [] },
      },
    };
    updating({ work: [quiet] });
    expect(screen.queryByRole("button", { name: m.update_wait() })).toBeNull();
  });

  it("puts the plan away when it is left as it is", async () => {
    const ondrop = vi.fn();
    updating({ work: [planRecord], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(planRecord.id);
  });

  it("keeps a record of what the update came to, and no plan once taken", async () => {
    const ondrop = vi.fn();
    updating({ work: [movedRecord], ondrop });

    expect(
      screen.queryByRole("region", { name: m.update_plan_title() }),
    ).toBeNull();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(movedRecord.id);
  });

  it("is silenced while a request is in flight", () => {
    updating({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_update_plan() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("presses to nothing where nothing answers the controls", async () => {
    updating({
      work: [{ ...planRecord, id: "75", at: "under-way", job: "5c63" }],
    });
    await press(m.action_hide_record());
    await press(m.action_update_plan());
    expect(within(asked()).getByText(m.doing_update_title())).toBeVisible();
  });
});
