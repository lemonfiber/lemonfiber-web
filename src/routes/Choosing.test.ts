import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { filler, fillMade, fillOffer, wouldFill } from "./fillings";
import { outright, wiring } from "../api/wirings";
import type { Filler } from "../lib/filling";
import type { Freshness } from "../lib/freshness";
import type { Wiring } from "../lib/wiring";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the wiring read and choosing handed this. */
function drawn(given: Filler, wired: Wiring = wiring): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    wiring: { ok: true, value: wired },
    filler: given,
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.fill_asked() });

describe("choosing what fills a capability, on the settings screen", () => {
  it("offers each choice once, with the one chosen now taken", () => {
    drawn(filler);
    const choices = screen.getByRole("region", { name: m.fill_said() });
    expect(within(choices).getAllByRole("heading", { level: 3 })).toHaveLength(
      2,
    );
    const subtitles = within(choices).getByRole("radiogroup", {
      name: m.fill_candidates({ capability: "subtitles" }),
    });
    expect(
      within(subtitles).getByRole("radio", { name: "bazarr" }),
    ).toBeChecked();
  });

  it("asks what the chosen one would come to, with no reason where none was typed", async () => {
    const onask = vi.fn();
    drawn({ ...filler, onask });
    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_fill_preview({ capability: "subtitles" }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "wiring-fill",
      capability: "subtitles",
      service: "bazarr",
      reason: undefined,
    });
  });

  it("stands the offer's yes under it, and puts it away on leaving it", async () => {
    const onask = vi.fn();
    const ondrop = vi.fn();
    drawn({ ...filler, work: [fillOffer], onask, ondrop });
    expect(
      within(asked()).getByRole("heading", {
        name: m.fill_plan_title({ service: "jellyseerr" }),
      }),
    ).toBeVisible();

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_fill_yes() }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "wiring-fill",
      capability: "requests",
      service: "jellyseerr",
      reason: "Jellyseerr knows the household.",
      offer: wouldFill.agreement,
    });

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(ondrop).toHaveBeenCalledWith(fillOffer.id);
  });

  it("hides a record on asking", async () => {
    const ondrop = vi.fn();
    drawn({ ...filler, work: [fillMade], ondrop });
    expect(
      within(asked()).queryByRole("button", { name: m.action_fill_yes() }),
    ).toBeNull();
    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_hide_record() }),
    );
    expect(ondrop).toHaveBeenCalledWith(fillMade.id);
  });

  it("keeps what was asked in view where there is no longer a choice to make", () => {
    drawn({ ...filler, work: [fillMade] }, { wired: [outright], unfilled: [] });
    expect(asked()).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", {
        name: m.fill_candidates({ capability: "requests" }),
      }),
    ).toBeNull();
  });

  it("presses to nothing where nothing answers the controls", async () => {
    drawn({ ...filler, work: [fillOffer] });
    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_fill_preview({ capability: "subtitles" }),
      }),
    );
    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(asked()).toBeInTheDocument();
  });

  it("offers nothing where there is no choice and nothing was asked", () => {
    drawn(filler, { wired: [outright], unfilled: [] });
    expect(screen.queryByRole("region", { name: m.fill_said() })).toBeNull();
  });
});
