import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  times,
  type Asked,
  type Says,
} from "./served";
import {
  clearOffer,
  countries,
  madeClear,
  madeSet,
  setOffer,
  values,
  vpnType,
  wouldClear,
  wouldSet,
} from "../api/values";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the settings the services read. */
const settings = "/api/settings";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The settings screen, against a stack whose settings writes answer as told. */
function valuing(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: {
        [settings]: { status: 200, body: enveloped("settings", values) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

/** The panel, once the settings are read. */
const panel = (): Promise<HTMLElement> =>
  screen.findByRole("region", { name: m.values_title() });

/** Where what the panel asked for is answered. */
const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.values_asked() });

describe("the settings the services read, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    const sent = fresh();
    valuing(sent, {});

    expect(
      await within(await panel()).findByRole("heading", {
        name: vpnType.name,
      }),
    ).toBeVisible();
    expect(times(sent, settings)).toBe(1);
  });
});

describe("moving a setting, from the settings screen", () => {
  it("reads the change first, makes it on a yes naming the reading, and reads the settings again", async () => {
    const sent = fresh();
    valuing(sent, {
      "settings-set": [
        { status: 200, body: enveloped("settings", wouldSet) },
        { status: 200, body: enveloped("settings", madeSet) },
      ],
    });

    const shown = await panel();
    await userEvent.click(
      await within(shown).findByRole("radio", { name: "wireguard" }),
    );
    await userEvent.click(
      within(shown).getByRole("button", { name: m.action_values_read() }),
    );
    await userEvent.click(
      await within(asked()).findByRole("button", {
        name: m.action_values_yes({ offer: setOffer }),
      }),
    );
    expect(
      await within(asked()).findByText(m.came_values_made()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/settings-set",
        body: JSON.stringify({
          values: { "gluetun:vpn-type": "wireguard" },
          dry_run: true,
        }),
      },
      {
        at: "/api/actions/settings-set",
        body: JSON.stringify({
          values: { "gluetun:vpn-type": "wireguard" },
          offer: setOffer,
        }),
      },
    ]);
    expect(times(sent, settings)).toBe(2);
  });

  it("clears a recorded value the same way", async () => {
    const sent = fresh();
    valuing(sent, {
      "settings-clear": [
        { status: 200, body: enveloped("settings", wouldClear) },
        { status: 200, body: enveloped("settings", madeClear) },
      ],
    });

    const shown = await panel();
    await userEvent.click(
      await within(shown).findByRole("button", {
        name: m.action_values_clear({ setting: countries.name }),
      }),
    );
    await userEvent.click(
      within(shown).getByRole("button", {
        name: m.action_values_read_clear(),
      }),
    );
    await userEvent.click(
      await within(asked()).findByRole("button", {
        name: m.action_values_yes({ offer: clearOffer }),
      }),
    );
    expect(
      await within(asked()).findByText(m.came_values_made()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/settings-clear",
        body: JSON.stringify({
          settings: ["gluetun:countries"],
          dry_run: true,
        }),
      },
      {
        at: "/api/actions/settings-clear",
        body: JSON.stringify({
          settings: ["gluetun:countries"],
          offer: clearOffer,
        }),
      },
    ]);
  });

  it("says a refused change in lemonfiber's words", async () => {
    const refused =
      "gluetun:vpn-type takes wireguard or openvpn, and was given ipsec.";
    valuing(fresh(), { "settings-set": [{ status: 422, body: refused }] });

    const shown = await panel();
    await userEvent.click(
      await within(shown).findByRole("radio", { name: "wireguard" }),
    );
    await userEvent.click(
      within(shown).getByRole("button", { name: m.action_values_read() }),
    );
    expect(await within(asked()).findByText(refused)).toBeInTheDocument();
  });
});
