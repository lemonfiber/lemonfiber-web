import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Requests from "./Requests.svelte";
import type { Tracer } from "./tracing.svelte";
import { stalled, stalledSeries } from "../api/stalls";
import type { Freshness } from "../lib/freshness";
import { heldLine, shortLines, type Stuck } from "../lib/stuck";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** Nothing looked up yet. */
const tracer: Tracer = { reading: undefined, busy: false, onlook: vi.fn() };

/** The requests screen, with the stuck items read. */
function reading(stuck: Reading<Stuck> | undefined, following?: Tracer): void {
  render(Requests, {
    household: undefined,
    freshness: answered,
    stuck,
    tracer: following,
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_stuck() });

describe("the stuck downloads, on the requests screen", () => {
  it("is not drawn until it answers", () => {
    reading(undefined);
    expect(screen.queryByRole("region", { name: m.panel_stuck() })).toBeNull();
  });

  it("names each stuck item with where it is held, under what may be missing", () => {
    reading({ ok: true, value: stalled });
    for (const line of shortLines(stalled)) {
      expect(within(panel()).getByText(line)).toBeVisible();
    }
    const items = within(panel()).getByRole("list", { name: m.stuck_said() });
    expect(
      within(items).getByRole("heading", { name: stalledSeries.title }),
    ).toBeVisible();
    expect(within(items).getByText(heldLine(stalledSeries))).toBeVisible();
    expect(screen.queryByRole("button", { name: /follow/i })).toBeNull();
  });

  it("follows one item to where it is", async () => {
    const onlook = vi.fn();
    reading({ ok: true, value: stalled }, { ...tracer, onlook });

    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_stuck_follow({ title: stalledSeries.title }),
      }),
    );

    expect(onlook).toHaveBeenCalledWith({
      term: stalledSeries.title,
      season: undefined,
    });
  });

  it("is silenced while an item is being looked up", () => {
    reading({ ok: true, value: stalled }, { ...tracer, busy: true });
    expect(
      screen.getByRole("button", {
        name: m.action_stuck_follow({ title: stalledSeries.title }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("says so where nothing is stuck", () => {
    reading({
      ok: true,
      value: { incomplete: false, items: [], unsupported: [] },
    });
    expect(within(panel()).getByText(m.stuck_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.stuck_said() }),
    ).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
