import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { outright, wiring } from "../api/wirings";
import { linkLines } from "../lib/wiring";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads what is wired to what. */
const wired = "/api/wiring";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what is wired to what, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [wired]: { status: 200, body: enveloped("wiring", wiring) },
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
      name: m.panel_wiring(),
    });
    expect(
      await within(panel).findByText(linkLines(outright)[1] ?? ""),
    ).toBeVisible();
    expect(times(sent, wired)).toBe(1);
  });
});
