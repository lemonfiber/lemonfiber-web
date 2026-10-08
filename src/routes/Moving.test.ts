import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Checks from "./Checks.svelte";
import { adoptMade, adoptOffer, mover, replaceOffer } from "./movings";
import { wouldReplace } from "../api/moves";
import { survey, unread } from "../api/surveys";
import type { Freshness } from "../lib/freshness";
import type { Mover } from "../lib/moving";
import type { Survey } from "../lib/survey";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The checks screen, with what is here surveyed and acting on it handed this. */
function drawn(given: Mover, found: Survey = survey): void {
  render(Checks, {
    diagnosis: undefined,
    freshness: answered,
    survey: { ok: true, value: found },
    mover: given,
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.move_asked() });

describe("acting on what is already here, on the checks screen", () => {
  it("offers each way forward the survey names, asked about first", async () => {
    const onask = vi.fn();
    drawn({ ...mover, onask });
    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_move_preview({ mode: "adopt" }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({ doing: "migrate-adopt" });
    expect(
      screen.getByRole("button", {
        name: m.action_move_preview({ mode: "replace" }),
      }),
    ).toBeInTheDocument();
  });

  it("offers none of a mode it has no request for", () => {
    drawn(mover, {
      ...survey,
      modes: [
        { mode: "teleport", what: "", disturbs: false, preselected: false },
      ],
    });
    expect(
      screen.queryByRole("button", {
        name: m.action_move_preview({ mode: "teleport" }),
      }),
    ).toBeNull();
  });

  it("stands a yes under an adoption, saying it means the backup was taken", async () => {
    const onask = vi.fn();
    const ondrop = vi.fn();
    drawn({ ...mover, work: [adoptOffer], onask, ondrop });
    expect(within(asked()).getByText(m.move_plan_backed_up())).toBeVisible();
    await userEvent.click(
      within(asked()).getByRole("button", {
        name: m.action_move_yes({ mode: "adopt" }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "migrate-adopt",
      confirm: true,
    });
    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(ondrop).toHaveBeenCalledWith(adoptOffer.id);
  });

  it("stands a replacement's yes under the offer that named what it stops", async () => {
    const onask = vi.fn();
    drawn({ ...mover, work: [replaceOffer], onask });
    expect(within(asked()).getByText(m.move_plan_replace())).toBeVisible();
    expect(within(asked()).queryByText(m.move_plan_backed_up())).toBeNull();
    await userEvent.click(
      within(asked()).getByRole("button", {
        name: m.action_move_yes({ mode: "replace" }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "migrate-replace",
      offer: wouldReplace.agreement,
    });
  });

  it("hides a record on asking, and stands no yes once done", async () => {
    const ondrop = vi.fn();
    drawn({ ...mover, work: [adoptMade], ondrop });
    expect(
      within(asked()).queryByRole("button", {
        name: m.action_move_yes({ mode: "adopt" }),
      }),
    ).toBeNull();
    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_hide_record() }),
    );
    expect(ondrop).toHaveBeenCalledWith(adoptMade.id);
  });

  it("shows an act still under way, with nothing to agree to", () => {
    drawn({
      ...mover,
      busy: true,
      work: [
        {
          id: "104",
          doing: "migrate-beside",
          scoped: false,
          given: { confirm: true },
          at: "under-way",
          job: "j-104",
        },
      ],
    });
    expect(
      within(asked()).getByText(m.doing_migrate_beside_title()),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: m.action_move_preview({ mode: "adopt" }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("presses to nothing where nothing answers the controls", async () => {
    drawn({ ...mover, work: [adoptOffer] });
    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_move_preview({ mode: "replace" }),
      }),
    );
    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(asked()).toBeInTheDocument();
  });

  it("offers nothing where the engine could not be asked", () => {
    drawn(mover, unread);
    expect(screen.queryByRole("status", { name: m.move_asked() })).toBeNull();
  });
});
