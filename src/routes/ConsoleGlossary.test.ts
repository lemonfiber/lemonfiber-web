import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { seed, vocabulary } from "../api/vocabularies";

import * as m from "../paraglide/messages.js";

/** Where the settings screen reads every word lemonfiber explains. */
const held = "/api/explain";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("the words lemonfiber explains, from the settings screen", () => {
  it("are read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [held]: { status: 200, body: enveloped("glossary", vocabulary) },
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
      name: m.panel_words(),
    });
    expect(
      await within(panel).findByRole("heading", { name: seed.word }),
    ).toBeVisible();
    expect(times(sent, held)).toBe(1);
  });

  it("hands a refused key on to whoever asks for another", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const onrefused = vi.fn();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: { [held]: { status: 401, body: "" } },
      },
      fresh(),
    );
    render(Console, {
      reaching: { at: here, token: key, sending, fetching: silent },
      onrefused,
      pausing: () => Promise.resolve(),
    });

    await vi.waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });
});
