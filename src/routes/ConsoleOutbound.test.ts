import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { leaving, updates } from "../api/leavings";
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
