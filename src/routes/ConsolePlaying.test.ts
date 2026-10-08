import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { film, playing } from "../api/playings";
import { playedOf } from "../lib/playing";
import * as m from "../paraglide/messages.js";

/** Where the overview reads what is playing now. */
const watching = "/api/playing";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what is playing now, from the overview", () => {
  it("is read on the way in, with the stack", async () => {
    globalThis.history.replaceState(undefined, "", "/");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [watching]: { status: 200, body: enveloped("playing", playing) },
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
      name: m.panel_playing(),
    });
    expect(
      await within(panel).findByRole("heading", { name: playedOf(film) }),
    ).toBeVisible();
    expect(times(sent, watching)).toBe(1);
  });
});
