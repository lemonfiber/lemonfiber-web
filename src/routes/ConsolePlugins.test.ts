import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { plugins, subtitles } from "../api/installs";
import { nameOf } from "../lib/plugins";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the plugins. */
const held = "/api/plugins";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("the plugins, from the settings screen", () => {
  it("are read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [held]: { status: 200, body: enveloped("plugins", plugins) },
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
      name: m.panel_plugins(),
    });
    expect(await within(panel).findByText(nameOf(subtitles))).toBeVisible();
    expect(times(sent, held)).toBe(1);
  });
});
