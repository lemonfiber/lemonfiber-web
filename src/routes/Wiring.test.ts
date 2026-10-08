import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { contested, wiring } from "../api/wirings";
import type { Freshness } from "../lib/freshness";
import { linkLines, unfilledLine, type Wiring } from "../lib/wiring";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with what is wired to what read. */
function reading(wired: Reading<Wiring> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, wiring: wired });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_wiring() });

describe("what is wired to what, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names each link under the service it runs from", () => {
    reading({ ok: true, value: wiring });
    const links = within(panel()).getByRole("list", {
      name: m.wiring_said(),
    });
    expect(within(links).getAllByRole("heading")).toHaveLength(
      wiring.wired.length,
    );
    for (const line of linkLines(contested)) {
      expect(within(links).getByText(line)).toBeVisible();
    }
  });

  it("names every ask nothing fills", () => {
    reading({ ok: true, value: wiring });
    const unfilled = within(panel()).getByRole("region", {
      name: m.wiring_unfilled_said(),
    });
    for (const one of wiring.unfilled) {
      expect(within(unfilled).getByText(unfilledLine(one))).toBeVisible();
    }
  });

  it("says so where nothing is wired", () => {
    reading({ ok: true, value: { wired: [], unfilled: [] } });
    expect(within(panel()).getByText(m.wiring_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("region", {
        name: m.wiring_unfilled_said(),
      }),
    ).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
