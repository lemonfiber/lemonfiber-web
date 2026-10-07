import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { leaving, stranger, updates } from "../api/leavings";
import type { Freshness } from "../lib/freshness";
import { oursLines, theirsLines, type Leaving } from "../lib/leaving";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with what leaves this machine read. */
function reading(outbound: Reading<Leaving> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, outbound });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_outbound() });

describe("what leaves this machine, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names each of lemonfiber's own requests, with what travels and what switches it off", () => {
    reading({ ok: true, value: leaving });
    const ours = within(panel()).getByRole("region", {
      name: m.outbound_ours(),
    });
    expect(
      within(ours).getByRole("heading", { name: updates.purpose }),
    ).toBeVisible();
    for (const line of oursLines(updates)) {
      expect(within(ours).getByText(line)).toBeVisible();
    }
  });

  it("names each service's requests, and says where no record is shipped", () => {
    reading({ ok: true, value: leaving });
    const theirs = within(panel()).getByRole("region", {
      name: m.outbound_theirs(),
    });
    expect(
      within(theirs).getByRole("heading", { name: stranger.service }),
    ).toBeVisible();
    for (const line of theirsLines(stranger)) {
      expect(within(theirs).getByText(line)).toBeVisible();
    }
  });

  it("says so where either account is empty", () => {
    reading({ ok: true, value: { ours: [], theirs: [] } });
    expect(within(panel()).getAllByText(m.outbound_none())).toHaveLength(2);
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
