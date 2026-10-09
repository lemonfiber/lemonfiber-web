import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { madeAtOnce } from "../api/configs";
import { household, leaving, updates } from "../api/leavings";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads what leaves this machine. */
const outbound = "/api/outbound";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what leaves this machine, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [outbound]: { status: 200, body: enveloped("outbound", leaving) },
        },
      },
      sent,
    );
    render(Console, {
      reaching: { at: here, token: key, sending, fetching: silent },
      onrefused: vi.fn(),
      pausing: () => Promise.resolve(),
    });

    const panel = await screen.findByRole("region", {
      name: m.panel_outbound(),
    });
    expect(
      await within(panel).findByRole("heading", { name: updates.purpose }),
    ).toBeVisible();
    expect(times(sent, outbound)).toBe(1);
  });
});

describe("switching one of lemonfiber's own requests", () => {
  it("asks for the setting named beside it, turned the other way, and reads the settings again", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {
          "config-set": [
            { status: 200, body: enveloped("config", madeAtOnce) },
            { status: 200, body: enveloped("config", madeAtOnce) },
          ],
        },
        becoming: [],
        reading: {
          [outbound]: { status: 200, body: enveloped("outbound", leaving) },
        },
      },
      sent,
    );
    render(Console, {
      reaching: { at: here, token: key, sending, fetching: silent },
      onrefused: vi.fn(),
      pausing: () => Promise.resolve(),
    });
    const panel = await screen.findByRole("region", {
      name: m.panel_outbound(),
    });
    await within(panel).findByRole("heading", { name: updates.purpose });
    const switches = within(panel).getAllByRole("button", {
      name: m.outbound_switch(),
    });
    expect(
      switches.map((one) => one.getAttribute("aria-pressed")),
    ).toStrictEqual([String(updates.allowed), String(household.allowed)]);

    await userEvent.click(switches[0] ?? document.body);
    await waitFor(() => {
      expect(sent.posted.map((one) => one.body)).toStrictEqual([
        JSON.stringify({ key: updates.switch, value: "off" }),
      ]);
    });
    await waitFor(() => {
      expect(times(sent, outbound)).toBe(2);
    });
  });
});
