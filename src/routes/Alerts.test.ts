import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { alerts } from "../api/alerting";
import { exceptionLine, presetLines, type Alerts } from "../lib/alerts";
import type { Freshness } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with what the operator is told about read. */
function reading(told: Reading<Alerts> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, alerts: told });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_alerts() });

describe("what the operator is told about, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names the preset and what it means, and each kind set apart", () => {
    reading({ ok: true, value: alerts });
    for (const line of presetLines(alerts)) {
      expect(within(panel()).getByText(line)).toBeVisible();
    }
    const apart = within(panel()).getByRole("list", {
      name: m.alerts_said(),
    });
    for (const one of alerts.exceptions) {
      expect(within(apart).getByText(exceptionLine(one))).toBeVisible();
    }
  });

  it("says so where nothing is set apart", () => {
    reading({ ok: true, value: { ...alerts, exceptions: [] } });
    expect(within(panel()).getByText(m.alerts_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.alerts_said() }),
    ).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
