import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { movedRecord, plan, planRecord, updater } from "./lined";
import type { Freshness } from "../lib/freshness";
import { stepLine } from "../lib/updated";
import type { Updater } from "../lib/updating";
import { stoppingServices, type Stopping } from "../lib/inflight";
import { coming, expanse, nothingComing } from "../api/inflights";
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
    updating({ work: [planRecord], onask, inflight: () => coming });

    expect(
      screen.getByRole("progressbar", { name: expanse.name }),
    ).toBeInTheDocument();
    await press(m.inflight_finish());
    expect(onask).toHaveBeenLastCalledWith({
      doing: "update",
      confirm: true,
      wait: true,
      offer: plan.offer,
    });
    await press(m.action_update_yes());
    expect(onask).toHaveBeenLastCalledWith({
      doing: "update",
      confirm: true,
      wait: false,
      offer: plan.offer,
    });
  });

  it("holds the yes until what is still downloading has been checked", () => {
    updating({ work: [planRecord], inflight: () => undefined });
    expect(screen.getByText(m.inflight_checking())).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: m.action_update_yes() }),
    ).toBeNull();
  });

  it("adds nothing about downloads where the stack names none", () => {
    updating({ work: [planRecord] });
    expect(
      screen.queryByRole("button", { name: m.inflight_finish() }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: m.inflight_heading() }),
    ).toBeNull();
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

  it("offers moving each service alone, beside its step", async () => {
    const onask = vi.fn();
    updating({ work: [planRecord], onask });
    const [first] = plan.changes;

    await press(m.action_update_one({ service: first?.service ?? "" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "update",
      service: first?.service,
    });
    expect(asked()).toHaveFocus();
  });

  it("reads one service's plan for what stopping it alone interrupts, and moves it on a yes naming it", async () => {
    const onask = vi.fn();
    const one = plan.changes.slice(0, 1);
    const service = one[0]?.service ?? "";
    const read: Stopping[] = [];
    updating({
      work: [
        {
          id: "76",
          doing: "update",
          scoped: false,
          given: { service },
          at: "done",
          job: undefined,
          came: { kind: "update", report: { ...plan, changes: one } },
        },
      ],
      onask,
      inflight: (stopping) => {
        read.push(stopping);
        return { ok: true, value: nothingComing };
      },
    });

    const shown = within(asked()).getByRole("region", {
      name: m.update_one_title({ service }),
    });
    expect(read).toContainEqual(stoppingServices([service]));
    expect(
      within(shown).queryByRole("button", {
        name: m.action_update_one({ service }),
      }),
    ).toBeNull();
    await press(m.action_update_yes());
    expect(onask).toHaveBeenLastCalledWith({
      doing: "update",
      confirm: true,
      wait: false,
      offer: plan.offer,
      service,
    });
  });

  it("heads the record of a service moved alone with its name", () => {
    updating({ work: [{ ...movedRecord, given: { service: "sonarr" } }] });
    expect(
      within(asked()).getByText(
        m.doing_update_one_title({ service: "sonarr" }),
      ),
    ).toBeVisible();
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
