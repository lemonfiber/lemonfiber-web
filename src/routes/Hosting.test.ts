import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.svelte";
import { chosenForm, controls } from "./fixture";
import { clock, guard, hosted, hoster, keptRecord, unhosted } from "./removals";
import type { Freshness } from "../lib/freshness";
import type { Hoster } from "../lib/hosting";
import { commandLines, type Hosted } from "../lib/removed";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 3 };

/**
 * The overview, with what this machine keeps running under the controls. A
 * reading of null is one that has not answered yet.
 */
function hosting(
  over: Partial<Hoster> = {},
  reading: Reading<Hosted> | null = { ok: true, value: hosted },
  chosen: readonly string[] = [chosenForm],
): void {
  render(Dashboard, {
    stack: undefined,
    programs: undefined,
    moment: undefined,
    flow: "opening",
    read: answered,
    live: { kind: "never" },
    controls: { ...controls, chosen },
    hosting: { hoster: { ...hoster, ...over }, hosted: reading ?? undefined },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_hosting() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.hosting_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("what this machine keeps running, on the overview", () => {
  it("is not drawn where nothing answers it", () => {
    render(Dashboard, {
      stack: undefined,
      programs: undefined,
      moment: undefined,
      flow: "opening",
      read: answered,
      live: { kind: "never" },
      controls,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_hosting() }),
    ).toBeNull();
  });

  it("says what each command does, how it runs and where it stands", () => {
    hosting();
    const listed = within(panel()).getByRole("list", {
      name: m.hosting_said(),
    });
    for (const command of hosted.commands) {
      for (const line of commandLines(command)) {
        expect(within(listed).getAllByText(line)[0]).toBeVisible();
      }
    }
    expect(
      within(panel()).getByText(
        "launchd starts it again only after you sign in.",
      ),
    ).toBeVisible();
  });

  it("waits while the reading has not answered", () => {
    hosting({}, null);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
    expect(within(panel()).queryByRole("list")).toBeNull();
  });

  it("says why it could not be read, in lemonfiber's words", () => {
    hosting(
      {},
      { ok: false, problem: { kind: "refused", message: "No manager here." } },
    );
    expect(within(panel()).getByText("No manager here.")).toBeVisible();
  });

  it("offers nothing a machine cannot keep, and says what to do instead", () => {
    hosting({}, { ok: true, value: unhosted });
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_host({ name: "watch" }),
      }),
    ).toBeNull();
    expect(
      within(panel()).getByText(
        "Start lemonfiber watch from your own service manager.",
      ),
    ).toBeVisible();
  });
});

describe("keeping one running, or taking it back", () => {
  it("keeps the guard running over the forms chosen", async () => {
    const onask = vi.fn();
    hosting({ onask });

    await press(m.action_host({ name: "watch" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "hosting-install",
      command: guard,
      forms: [chosenForm],
    });
    expect(asked()).toHaveFocus();
  });

  it("waits for forms to guard before keeping the guard running", () => {
    hosting({}, { ok: true, value: hosted }, []);
    expect(within(panel()).getByText(m.hosting_choose_forms())).toBeVisible();
    expect(
      screen.getByRole("button", { name: m.action_host({ name: "watch" }) }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("takes back one that is kept, or one whose program is gone", async () => {
    const onask = vi.fn();
    hosting({ onask });

    await press(m.action_unhost({ name: "expiring" }));
    expect(onask).toHaveBeenCalledWith({
      doing: "hosting-remove",
      command: clock,
    });
    expect(
      screen.getByRole("button", { name: m.action_unhost({ name: "boot" }) }),
    ).toBeVisible();
  });

  // Nothing comes back to read before either, so the question states what the
  // command does and what it guards, and the yes is to that question.
  it("asks first, in the words of what it does, and goes ahead on a yes", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    const asking = {
      doing: "hosting-install" as const,
      command: guard,
      forms: [chosenForm],
    };
    hosting({ asked: asking, onask, onleave });

    const question = within(asked());
    expect(
      question.getByText(m.confirm_host_title({ name: "watch" })),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: m.action_host({ name: "watch" }) }),
    ).toHaveAttribute("aria-disabled", "true");

    await press(m.action_host_yes());
    expect(onask).toHaveBeenCalledWith(asking);
    await press(m.action_leave_as_is());
    expect(onleave).toHaveBeenCalled();
  });

  it("keeps a record of what it came to", async () => {
    const ondrop = vi.fn();
    hosting({ work: [keptRecord], ondrop });

    expect(
      within(asked()).getByText(m.hosting_installed({ name: "watch" })),
    ).toBeVisible();
    await press(m.action_hide_record());
    expect(ondrop).toHaveBeenCalledWith(keptRecord.id);
  });

  it("is silenced while a request is in flight", () => {
    hosting({ busy: true });
    expect(
      screen.getByRole("button", {
        name: m.action_unhost({ name: "expiring" }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("presses to nothing where nothing answers the controls", async () => {
    hosting({
      work: [{ ...keptRecord, id: "85", at: "under-way", job: "7d10" }],
    });
    await press(m.action_hide_record());
    await press(m.action_host({ name: "watch" }));
    expect(within(asked()).getByText(m.doing_host_title())).toBeVisible();
  });
});
