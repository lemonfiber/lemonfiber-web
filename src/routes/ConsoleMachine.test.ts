import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { servedPlain, settledDone, shipped } from "../api/machines";
import * as m from "../paraglide/messages.js";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The console on its settings, with how this machine stands answered. */
function opened(): ReturnType<typeof fresh> {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sent = fresh();
  const sending = stack(
    {
      acting: {},
      becoming: [],
      reading: {
        "/api/served": { status: 200, body: enveloped("served", servedPlain) },
        "/api/stack": { status: 200, body: enveloped("stack", shipped) },
        "/api/settled": {
          status: 200,
          body: enveloped("settled", settledDone),
        },
      },
    },
    sent,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
  return sent;
}

describe("how this machine stands, from the console", () => {
  it("is read on the way into the settings, once each, and raises the alarm it calls for", async () => {
    const sent = opened();
    const served = await screen.findByRole("region", {
      name: m.panel_served(),
    });
    expect(
      await within(served).findByText(m.served_plain_network()),
    ).toBeVisible();
    expect(await screen.findByText(m.served_alarm_lead())).toBeVisible();
    expect(
      await screen.findByRole("region", { name: m.panel_stack() }),
    ).toBeVisible();
    expect(
      await screen.findByRole("region", { name: m.panel_settled() }),
    ).toBeVisible();
    for (const path of ["/api/served", "/api/stack", "/api/settled"]) {
      expect(times(sent, path)).toBe(1);
    }
  });
});
