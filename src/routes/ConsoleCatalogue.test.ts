import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { catalogue, provenance } from "../api/catalogues";
import { originLines } from "../lib/catalogue";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads what each service is for. */
const catalogued = "/api/catalogue";

/** Where it reads where each service comes from. */
const origins = "/api/provenance";

/** The first line of where the first service comes from. */
const [pinned] = provenance.services;
const first = pinned === undefined ? "" : (originLines(pinned)[0] ?? "");

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("what the stack holds, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [catalogued]: {
            status: 200,
            body: enveloped("catalogue", catalogue),
          },
          [origins]: {
            status: 200,
            body: enveloped("provenance", provenance),
          },
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
      name: m.panel_catalogue(),
    });
    expect(await within(panel).findByText(first)).toBeVisible();
    expect(times(sent, catalogued)).toBe(1);
    expect(times(sent, origins)).toBe(1);
  });
});
