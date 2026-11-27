import { screen, within } from "@testing-library/svelte";
import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { moment } from "./fixture";
import { answering, console_, framed, press, saying } from "./Console.testing";
import { enveloped } from "./served";
import type { Scheduled } from "../lib/scheduled";
import { wentNow, wouldRun } from "../api/runs";
import * as m from "../paraglide/messages.js";

const configarr: Scheduled = {
  id: "configarr",
  name: "Configarr",
  fired: true,
  health: "succeeded",
  running: false,
  skipped: 0,
};

/** A stack that rehearses a run first, and runs it the second time. */
function running(posted: { at: string; body: string }[]): Sending {
  return (url, init) => {
    if (init.method !== "POST") return answering(url, init);
    posted.push({ at: new URL(url).pathname, body: init.body ?? "" });
    const report = posted.length === 1 ? wouldRun : wentNow;
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(enveloped("ran", report)),
    });
  };
}

describe("running a scheduled service now from the overview", () => {
  it("rehearses it first, then runs it on a yes naming it, and says how it went", async () => {
    const posted: { at: string; body: string }[] = [];
    console_({
      sending: running(posted),
      fetching: saying([
        framed("dashboard", { ...moment, scheduled: [configarr] }),
      ]),
    });

    await screen.findByRole("button", {
      name: m.action_run_rehearse({ name: configarr.name }),
    });
    await press(m.action_run_rehearse({ name: configarr.name }));
    await screen.findByRole("button", {
      name: m.action_run_yes({ name: configarr.name }),
    });
    await press(m.action_run_yes({ name: configarr.name }));

    expect(posted).toStrictEqual([
      {
        at: "/api/actions/run",
        body: JSON.stringify({
          service: "configarr",
          now: true,
          dry_run: true,
        }),
      },
      {
        at: "/api/actions/run",
        body: JSON.stringify({ service: "configarr", now: true }),
      },
    ]);
    const requests = screen.getByRole("status", {
      name: m.scheduled_asked(),
    });
    expect(
      await within(requests).findByText(m.came_ran_skipped({ count: 2 })),
    ).toBeInTheDocument();
  });
});
