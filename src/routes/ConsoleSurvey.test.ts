import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { survey } from "../api/surveys";
import * as m from "../paraglide/messages.js";

/** Where the checks screen reads what is already on this machine. */
const surveyed = "/api/migration";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what is already on this machine, from the checks screen", () => {
  it("is read on the way in, with the checks", async () => {
    globalThis.history.replaceState(undefined, "", "/checks");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [surveyed]: { status: 200, body: enveloped("migration", survey) },
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
      name: m.panel_survey(),
    });
    expect(
      await within(panel).findByRole("heading", {
        name: m.survey_project({ project: "media" }),
      }),
    ).toBeVisible();
    expect(times(sent, surveyed)).toBe(1);
  });
});
