import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { alerts } from "../api/alerting";
import { presetLines } from "../lib/alerts";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads what the operator is told about. */
const told = "/api/alerts";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what the operator is told about, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [told]: { status: 200, body: enveloped("alerts", alerts) },
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
      name: m.panel_alerts(),
    });
    expect(
      await within(panel).findByText(presetLines(alerts)[0] ?? ""),
    ).toBeVisible();
    expect(times(sent, told)).toBe(1);
  });
});
