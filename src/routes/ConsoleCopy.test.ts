import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { behind, versions } from "../api/copies";
import { versionLines } from "../lib/copy";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the versions in play. */
const version = "/api/version";

/** Where it reads where this copy stands. */
const update = "/api/update";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("this copy of lemonfiber, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [version]: { status: 200, body: enveloped("version", versions) },
          [update]: { status: 200, body: enveloped("self-update", behind) },
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
      name: m.panel_copy(),
    });
    expect(
      await within(panel).findByText(versionLines(versions)[0] ?? ""),
    ).toBeVisible();
    expect(
      await within(panel).findByText(
        m.copy_command({ command: "brew upgrade lemonfiber" }),
      ),
    ).toBeVisible();
    expect(times(sent, version)).toBe(1);
    expect(times(sent, update)).toBe(1);
  });
});
