import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { changed, written } from "../api/histories";
import * as m from "../paraglide/messages.js";

/** Where the checks screen reads what lemonfiber changed. */
const history = "/api/history";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what lemonfiber changed, from the checks screen", () => {
  it("is read on the way in, with the checks", async () => {
    globalThis.history.replaceState(undefined, "", "/checks");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [history]: { status: 200, body: enveloped("history", changed) },
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
      name: m.panel_history(),
    });
    expect(
      await within(panel).findByRole("heading", { name: written.did }),
    ).toBeVisible();
    expect(times(sent, history)).toBe(1);
  });
});
