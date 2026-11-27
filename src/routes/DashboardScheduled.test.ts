import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { moment } from "./fixture";
import { ranLines } from "../lib/ran";
import { saidOfScheduled, type Scheduled } from "../lib/scheduled";
import type { Runner } from "../lib/scheduling";
import type { Work } from "../lib/work";
import { heldBack, wentNow, wouldRun } from "../api/runs";
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

const nothing = (): void => undefined;

const runner: Runner = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};

/** A record of a run asked for, answered with what it came to. */
const answered = (id: string, report: typeof wouldRun): Work => ({
  id,
  doing: "run",
  scoped: false,
  given: { service: failed.id, now: true, dry_run: report.rehearsed },
  at: "done",
  job: undefined,
  came: { kind: "ran", report },
});

/** The overview, with the scheduled services and what running one asks for. */
const running = (over: Partial<Runner> = {}): void => {
  board({
    moment: changed({ scheduled: [failed] }),
    flow: "live",
    runner: { ...runner, ...over },
  });
};

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const requests = (): HTMLElement =>
  screen.getByRole("status", { name: m.scheduled_asked() });

describe("running a scheduled service now", () => {
  it("offers nothing to press where nothing can be asked", () => {
    board({ moment: changed({ scheduled: [failed] }), flow: "live" });
    expect(within(panel()).queryByRole("button")).toBeNull();
    expect(requests()).toBeEmptyDOMElement();
  });

  it("rehearses it first, beside the service, by its id", async () => {
    const onask = vi.fn();
    running({ onask });

    await press(m.action_run_rehearse({ name: failed.name }));

    expect(onask).toHaveBeenCalledWith({ doing: "run", service: failed.id });
    expect(requests()).toHaveFocus();
  });

  it("says what the rehearsal found, and runs it on a yes naming it", async () => {
    const onask = vi.fn();
    running({ work: [answered("1", wouldRun)], onask });
    const shown = within(requests()).getByRole("region", {
      name: m.scheduled_rehearsal_title({ name: failed.name }),
    });
    for (const line of ranLines(wouldRun)) {
      expect(within(shown).getByText(line)).toBeInTheDocument();
    }

    await press(m.action_run_yes({ name: failed.name }));

    expect(onask).toHaveBeenLastCalledWith({
      doing: "run",
      service: failed.id,
      agreed: true,
    });
  });

  it("offers no yes where something holds it back, and says what", () => {
    running({ work: [answered("2", heldBack)] });
    expect(
      within(requests()).getAllByText(heldBack.held ?? "").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: m.action_run_yes({ name: failed.name }),
      }),
    ).toBeNull();
  });

  it("puts the rehearsal away when it is left as it is", async () => {
    const ondrop = vi.fn();
    running({ work: [answered("3", wouldRun)], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith("3");
  });

  it("keeps a record of how the run went, and no rehearsal once it ran", async () => {
    const ondrop = vi.fn();
    running({ work: [answered("4", wentNow)], ondrop });

    expect(
      within(requests()).queryByRole("region", {
        name: m.scheduled_rehearsal_title({ name: failed.name }),
      }),
    ).toBeNull();
    expect(within(requests()).getByText(m.doing_run_title())).toBeVisible();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith("4");
  });

  it("says a run is under way until it is known how it went", () => {
    running({
      work: [
        {
          id: "5",
          doing: "run",
          scoped: false,
          given: { service: failed.id, now: true },
          at: "under-way",
          job: "5c63",
        },
      ],
    });
    expect(within(requests()).getByText(m.doing_run_title())).toBeVisible();
    expect(
      within(requests()).queryByRole("list", { name: m.came_heading() }),
    ).toBeNull();
  });

  it("is silenced while a request is in flight", () => {
    running({ busy: true });
    expect(
      screen.getByRole("button", {
        name: m.action_run_rehearse({ name: failed.name }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
