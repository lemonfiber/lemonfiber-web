import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  started,
  times,
  type Asked,
  type Says,
} from "./served";
import { declared, means, moved, plan, shared } from "../api/lines";
import { inForce } from "../api/qualities";
import { stepLine } from "../lib/updated";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads how the line is shared. */
const bandwidth = "/api/bandwidth";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The settings screen, against a stack whose line and updates answer as told. */
function settling(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting,
      becoming,
      reading: {
        [bandwidth]: { status: 200, body: enveloped("bandwidth", shared) },
        "/api/quality": { status: 200, body: enveloped("quality", inForce) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("the line, from the settings screen", () => {
  it("reads how the line is shared on the way in", async () => {
    const sent = fresh();
    settling(sent, {});

    expect(await screen.findByText(means)).toBeInTheDocument();
    expect(times(sent, bandwidth)).toBe(1);
  });

  it("declares the limits typed, and reads the line again once they are written", async () => {
    const sent = fresh();
    settling(sent, {
      bandwidth: [{ status: 200, body: enveloped("bandwidth", declared) }],
    });
    await screen.findByText(means);

    await userEvent.type(screen.getByLabelText(m.line_down()), "50%");
    await press(m.action_line_declare());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/bandwidth", body: JSON.stringify({ down: "50%" }) },
    ]);
    const asked = screen.getByRole("status", { name: m.line_asked() });
    expect(
      await within(asked).findByText(m.doing_bandwidth_title()),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(times(sent, bandwidth)).toBe(2);
    });
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const unread =
      "`fast` is not a limit: give a share such as 50% or a figure.";
    settling(fresh(), { bandwidth: [{ status: 400, body: unread }] });
    await screen.findByText(means);

    await userEvent.type(screen.getByLabelText(m.line_down()), "fast");
    await press(m.action_line_declare());

    const asked = screen.getByRole("status", { name: m.line_asked() });
    expect(await within(asked).findByText(unread)).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});

describe("updating, from the settings screen", () => {
  it("reads every step first, then moves on the yes and follows it to its end", async () => {
    const sent = fresh();
    settling(
      sent,
      {
        update: [{ status: 200, body: enveloped("update", plan) }, started],
      },
      [started, { status: 200, body: enveloped("update", moved) }],
    );
    await screen.findByText(m.action_update_plan());

    await press(m.action_update_plan());
    const asked = screen.getByRole("status", { name: m.updates_asked() });
    const [first] = plan.changes;
    const shown = await within(asked).findByRole("region", {
      name: m.update_plan_title(),
    });
    expect(
      within(shown).getByText(first === undefined ? "" : stepLine(first)),
    ).toBeInTheDocument();
    await press(m.action_update_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/update", body: "{}" },
      {
        at: "/api/actions/update",
        body: JSON.stringify({ confirm: true, wait: false }),
      },
    ]);
    expect(
      await within(asked).findByText(m.came_update_partial()),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: m.update_plan_title() }),
    ).toBeNull();
  });
});
