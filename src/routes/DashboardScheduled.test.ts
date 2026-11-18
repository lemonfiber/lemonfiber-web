import { screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { moment } from "./fixture";
import { saidOfScheduled, type Scheduled } from "../lib/scheduled";
import * as m from "../paraglide/messages.js";
import { board, changed } from "./Dashboard.testing";

const failed: Scheduled = {
  id: "configarr",
  name: "Configarr",
  fired: true,
  health: "failed",
  running: false,
  skipped: 0,
  last: {
    started: 1_790_000_000,
    ended: 1_790_000_030,
    exit: 3,
    log: ["profile sync began", "the quality profile was refused"],
  },
};

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_scheduled() });

describe("what runs on a schedule", () => {
  it("names each run-and-exit service with how its last run ended", () => {
    board({ moment: changed({ scheduled: [failed] }), flow: "live" });
    expect(panel()).toHaveTextContent(failed.name);
    expect(panel()).toHaveTextContent(m.scheduled_failed());
    expect(panel()).toHaveTextContent(saidOfScheduled(failed));
  });

  it("shows the last lines a failed run wrote", () => {
    board({ moment: changed({ scheduled: [failed] }), flow: "live" });
    const lines = within(panel()).getByRole("list", {
      name: m.scheduled_lines(),
    });
    for (const line of failed.last?.log ?? [])
      expect(lines).toHaveTextContent(line);
  });

  it("shows no lines for a run that went fine", () => {
    const fine: Scheduled = {
      ...failed,
      health: "succeeded",
      last: { started: 1_790_000_000, ended: 1_790_000_030, exit: 0, log: [] },
    };
    board({ moment: changed({ scheduled: [fine] }), flow: "live" });
    expect(
      within(panel()).queryByRole("list", { name: m.scheduled_lines() }),
    ).toBeNull();
  });

  it("is left out where the stack runs nothing on a schedule", () => {
    board({ moment, flow: "live" });
    expect(
      screen.queryByRole("region", { name: m.panel_scheduled() }),
    ).toBeNull();
  });
});
