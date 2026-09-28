import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import {
  costed,
  inForce,
  putQualityBack,
  readCost,
  recyclarr,
  tuner,
} from "./tuned";
import type { Freshness } from "../lib/freshness";
import type { Tuned } from "../lib/tuned";
import type { Tuner } from "../lib/tuning";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 6 };

/** The settings screen, with what can be asked about the quality. */
function tuning(
  over: Partial<Tuner> = {},
  quality: Reading<Tuned> = { ok: true, value: inForce },
): void {
  render(Settings, {
    quality,
    freshness: answered,
    tuner: { ...tuner, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_quality() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.quality_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("the quality in force", () => {
  it("sets out each choice in the stack's own terms", () => {
    tuning();
    const list = within(panel()).getByRole("list", {
      name: m.quality_choices(),
    });
    expect(
      within(list).getByText(
        m.quality_choice({ scope: "everything", preset: "balanced" }),
      ),
    ).toBeInTheDocument();
    expect(
      within(list).getByText("Good-looking video that does not fill the disk."),
    ).toBeInTheDocument();
    expect(
      within(list).getByText(m.quality_music({ format: "lossless" })),
    ).toBeInTheDocument();
  });

  // Where this machine would have to transcode a choice in software, the row
  // says so, and it says so of no other.
  it("warns of a choice this machine would have to transcode", () => {
    tuning();
    expect(
      within(panel()).getAllByText(m.quality_transcodes_here()),
    ).toHaveLength(1);
  });

  it("says the config was edited by hand, and offers the recorded preset back", () => {
    tuning();
    expect(
      within(panel()).getByText(m.quality_customised()),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: m.action_reapply() }),
    ).toBeInTheDocument();
  });

  it("offers nothing to put back over a config nobody edited", () => {
    tuning(
      {},
      { ok: true, value: { ...inForce, customised: false, music: null } },
    );
    expect(screen.queryByText(m.quality_customised())).toBeNull();
    expect(
      screen.queryByRole("button", { name: m.action_reapply() }),
    ).toBeNull();
  });

  it("says why it could not be read, in lemonfiber's words", () => {
    tuning(
      {},
      {
        ok: false,
        problem: {
          kind: "unreachable",
          message: "lemonfiber is not answering.",
        },
      },
    );
    expect(
      within(panel()).getByText("lemonfiber is not answering."),
    ).toBeInTheDocument();
  });

  it("waits for an answer that has not come, and draws the choice alone where nothing answers", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: m.action_upgrade_cost() }),
    ).toBeNull();
  });
});

describe("putting the recorded quality back", () => {
  it("asks for it when pressed", async () => {
    const onask = vi.fn();
    tuning({ onask });

    await press(m.action_reapply());

    expect(onask).toHaveBeenCalledWith({ doing: "quality-reapply" });
  });

  // Nothing comes back to read before the edits are replaced, so what is lost
  // is said before the yes.
  it("says the edits are lost before the yes, and silences the rest meanwhile", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    tuning({ asked: { doing: "quality-reapply" }, onask, onleave });

    expect(
      within(asked()).getByText(m.confirm_reapply_prose()),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: m.action_upgrade_cost() }),
    ).toHaveAttribute("aria-disabled", "true");

    await press(m.action_reapply_yes());
    expect(onask).toHaveBeenCalledWith({ doing: "quality-reapply" });
    await press(m.action_leave_as_is());
    expect(onleave).toHaveBeenCalled();
    expect(asked()).toHaveFocus();
  });

  it("lists the file and the lines it replaced under its record", () => {
    tuning({ work: [putQualityBack] });
    const lines = within(asked()).getByRole("list", { name: m.came_heading() });
    expect(
      within(lines).getByText(m.came_quality_overwritten({ path: recyclarr })),
    ).toBeInTheDocument();
  });

  it("puts a record away when asked", async () => {
    const ondrop = vi.fn();
    tuning({ work: [putQualityBack], ondrop });

    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(putQualityBack.id);
  });
});

describe("fetching the library again", () => {
  // A story draws the panel from a tuner whose controls answer nothing, and
  // pressing one there must leave the screen as it was.
  it("stands still where nothing answers what is pressed", async () => {
    tuning();

    await press(m.action_upgrade_cost());

    expect(screen.queryByText(m.quality_cost_title())).toBeNull();
  });

  it("asks what it would cost first", async () => {
    const onask = vi.fn();
    tuning({ onask });

    await press(m.action_upgrade_cost());

    expect(onask).toHaveBeenCalledWith({ doing: "quality-upgrade" });
  });

  it("shows the cost, and the yes under it is the same request confirmed", async () => {
    const onask = vi.fn();
    tuning({ work: [readCost], onask });
    expect(costed.media[0]?.preset).toBe("balanced");

    expect(
      within(asked()).getByRole("heading", { name: m.quality_cost_title() }),
    ).toBeInTheDocument();
    expect(
      within(asked()).getByText(
        m.came_upgrade_cost({ kind: "tv", preset: "balanced", size: "2 GB" }),
      ),
    ).toBeInTheDocument();

    await press(m.action_upgrade_yes());

    expect(onask).toHaveBeenCalledWith({
      doing: "quality-upgrade",
      confirm: true,
    });
    expect(asked()).toHaveFocus();
  });

  it("puts the cost away when it is left as it is", async () => {
    const ondrop = vi.fn();
    tuning({ work: [readCost], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(readCost.id);
  });

  it("is silenced while a request is in flight", () => {
    tuning({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_upgrade_cost() }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
