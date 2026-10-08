import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { stalled, stalledFilm } from "../api/stalls";
import * as m from "../paraglide/messages.js";

/** Where the requests screen reads the stuck items. */
const stuck = "/api/stuck";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("the stuck downloads, from the requests screen", () => {
  it("is read on the way in, with the household", async () => {
    globalThis.history.replaceState(undefined, "", "/requests");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [stuck]: { status: 200, body: enveloped("stuck", stalled) },
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
      name: m.panel_stuck(),
    });
    expect(
      await within(panel).findByRole("heading", { name: stalledFilm.title }),
    ).toBeVisible();
    expect(times(sent, stuck)).toBe(1);
  });
});
