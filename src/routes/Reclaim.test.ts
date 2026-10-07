import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Storage from "./Storage.svelte";
import { busy, reclaimedRecord, reclaimer, roomy } from "./reclaims";
import { reckoned, stillShared } from "../api/spaces";
import { bytes } from "../lib/figures";
import type { Freshness } from "../lib/freshness";
import type { Reckoned } from "../lib/letting";
import { partLine } from "../lib/reclaimed";
import type { Reclaimer } from "../lib/reclaiming";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/**
 * The disk screen, with what of it could be got back. A reading of null is
 * one that has not answered yet.
 */
function reclaiming(
  over: Partial<Reclaimer> = {},
  space: Reading<Reckoned> | null = { ok: true, value: roomy },
): void {
  render(Storage, {
    disk: undefined,
    live: { kind: "never" },
    diagnosis: undefined,
    read: answered,
    reclaiming: {
      reclaimer: { ...reclaimer, ...over },
      space: space ?? undefined,
    },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_room() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.reclaim_asked() });

const yes = m.action_reclaim_yes({ size: bytes(3_221_225_472) });

describe("the room to get back, on the disk screen", () => {
  it("is not drawn where nothing answers it", () => {
    render(Storage, {
      disk: undefined,
      live: { kind: "never" },
      diagnosis: undefined,
      read: answered,
    });
    expect(screen.queryByRole("region", { name: m.panel_room() })).toBeNull();
  });

  it("names every part that could be got back, with what each would cost", () => {
    reclaiming();
    const parts = within(panel()).getByRole("list", {
      name: m.reclaim_said(),
    });
    for (const part of roomy.reclaimable) {
      expect(within(parts).getByText(partLine(part))).toBeVisible();
    }
  });

  it("holds a place while nothing has answered", () => {
    reclaiming({}, null);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("says why the accounting could not be read", () => {
    reclaiming({}, { ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });

  it("says so where nothing could be got back", () => {
    reclaiming({}, { ok: true, value: reckoned });
    expect(within(panel()).getByText(m.reclaim_none())).toBeVisible();
    expect(screen.queryByRole("button", { name: /take back/i })).toBeNull();
  });

  it("offers nothing where every part has a cost", () => {
    reclaiming(
      {},
      { ok: true, value: { ...roomy, reclaimable: [stillShared] } },
    );
    expect(within(panel()).getByText(m.reclaim_free_none())).toBeVisible();
    expect(screen.queryByRole("button", { name: /take back/i })).toBeNull();
  });
});

describe("taking back what costs nothing", () => {
  it("says yes under the offer, naming it, and puts the reader on what it came to", async () => {
    const onask = vi.fn();
    reclaiming({ onask });
    expect(within(panel()).getByText(m.reclaim_offer())).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: yes }));

    expect(onask).toHaveBeenCalledWith({
      doing: "space",
      offer: roomy.agreement,
    });
    expect(asked()).toHaveFocus();
  });

  it("is silenced while a request is in flight", () => {
    reclaiming({ busy: true });
    expect(screen.getByRole("button", { name: yes })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("keeps a record of what it took and what it could not", async () => {
    const ondrop = vi.fn();
    reclaiming({ work: [reclaimedRecord], ondrop });

    expect(within(asked()).getByText(m.doing_reclaim_title())).toBeVisible();
    expect(
      within(asked()).getByText(
        m.came_reclaim_left({ at: "/srv/downloads/open.mkv", why: busy }),
      ),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: m.action_hide_record() }),
    );

    expect(ondrop).toHaveBeenCalledWith(reclaimedRecord.id);
    expect(asked()).toHaveFocus();
  });

  it("presses to nothing where nothing answers the control", async () => {
    reclaiming();
    await userEvent.click(screen.getByRole("button", { name: yes }));
    expect(within(asked()).queryByText(m.doing_reclaim_title())).toBeNull();
  });
});
