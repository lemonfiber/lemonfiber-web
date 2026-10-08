import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { listing } from "../api/keylists";

import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the integration keys. */
const held = "/api/keys";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("the integration keys, from the settings screen", () => {
  it("are read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [held]: { status: 200, body: enveloped("keys", listing) },
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
      name: m.panel_keys(),
    });
    expect(
      await within(panel).findByRole("heading", { name: "home" }),
    ).toBeVisible();
    expect(times(sent, held)).toBe(1);
  });
});
