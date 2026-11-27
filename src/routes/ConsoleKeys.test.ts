import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { console_, routed } from "./Console.testing";
import {
  claimed,
  iphoneWoken,
  listing,
  phones,
  unpaired,
  unwoken,
  woken,
} from "../api/keylists";
import { nameOf } from "../lib/route";

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

  it("reads the phones' keys on the way in, and revokes one through its own route on a yes", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const asked: string[] = [];
    const answers: Partial<Record<string, string>> = {
      "GET /api/keys": enveloped("keys", listing),
      "GET /api/device-keys": enveloped("device-keys", phones),
      "DELETE /api/device-keys/iphone": enveloped("device-keys", unpaired),
    };
    console_({ sending: routed(answers, asked) });
    const panel = await screen.findByRole("region", {
      name: m.panel_phones(),
    });
    await userEvent.click(
      await within(panel).findByRole("button", {
        name: m.action_phones_revoke({ name: "iphone" }),
      }),
    );
    expect(asked).not.toContain("DELETE /api/device-keys/iphone");
    await userEvent.click(
      within(panel).getByRole("button", {
        name: m.action_phones_revoke_yes({ name: "iphone" }),
      }),
    );
    expect(
      await within(panel).findByText(m.phones_revoked({ name: "iphone" })),
    ).toBeVisible();
    expect(asked).toContain("DELETE /api/device-keys/iphone");
  });

  it("reads the phones that can be woken on the way in, and removes one through its own route on a yes", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const asked: string[] = [];
    console_({
      sending: routed(
        {
          "GET /api/push-endpoints": enveloped("push-endpoints", woken),
          "DELETE /api/push-endpoints/iphone": enveloped(
            "push-endpoints",
            unwoken,
          ),
        },
        asked,
      ),
    });
    const panel = await screen.findByRole("region", {
      name: m.panel_woken(),
    });
    await userEvent.click(
      await within(panel).findByRole("button", {
        name: m.action_woken_remove({ name: "iphone" }),
      }),
    );
    expect(asked).toContain("GET /api/push-endpoints");
    expect(asked).not.toContain("DELETE /api/push-endpoints/iphone");
    await userEvent.click(
      within(panel).getByRole("button", {
        name: m.action_woken_remove_yes({ name: "iphone" }),
      }),
    );
    expect(
      await within(panel).findByText(m.woken_removed({ name: "iphone" })),
    ).toBeVisible();
    expect(asked).toContain("DELETE /api/push-endpoints/iphone");
    expect(document.body.innerHTML).not.toContain(iphoneWoken.endpoint);
  });

  it("shows a claim's link once, and leaving the settings drops it", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {
          "/api/keys": [{ status: 200, body: enveloped("key-claim", claimed) }],
        },
        becoming: [],
        reading: {
          [held]: { status: 200, body: enveloped("keys", listing) },
          "/api/device-keys": {
            status: 200,
            body: enveloped("device-keys", phones),
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
    const panel = await screen.findByRole("region", { name: m.panel_keys() });
    await userEvent.click(
      within(panel).getByRole("radio", { name: m.keys_hand_claim() }),
    );
    await userEvent.type(within(panel).getByLabelText(m.keys_name()), "home");
    await userEvent.type(
      within(panel).getByLabelText(m.keys_password()),
      crypto.randomUUID(),
    );
    await userEvent.click(
      within(panel).getByRole("button", { name: m.action_keys_mint() }),
    );
    expect(await within(panel).findByText(claimed.link)).toBeVisible();
    expect(JSON.parse(sent.posted[0]?.body ?? "{}")).toMatchObject({
      claim: true,
    });

    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("overview")) }),
    );
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("settings")) }),
    );
    await screen.findByRole("region", { name: m.panel_keys() });
    expect(screen.queryByText(claimed.link)).toBeNull();
  });
});
