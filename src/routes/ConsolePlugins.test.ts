import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { console_ } from "./Console.testing";
import {
  enveloped,
  fresh,
  stack,
  times,
  type Asked,
  type Says,
} from "./served";
import { plugins, subtitles } from "../api/installs";
import {
  crossing,
  installOffer,
  readInstall,
  wouldInstallGranting,
} from "../api/plugs";
import { nameOf } from "../lib/plugins";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the plugins. */
const held = "/api/plugins";

/** The settings screen, against a stack whose plugin acts answer as told. */
function settings(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  console_({
    sending: stack(
      {
        acting,
        becoming: [],
        reading: {
          [held]: { status: 200, body: enveloped("plugins", plugins) },
        },
      },
      asked,
    ),
    pausing: () => Promise.resolve(),
  });
}

describe("the plugins, from the settings screen", () => {
  it("are read on the way in, with the other settings", async () => {
    const sent = fresh();
    settings(sent, {});

    const panel = await screen.findByRole("region", {
      name: m.panel_plugins(),
    });
    expect(await within(panel).findByText(nameOf(subtitles))).toBeVisible();
    expect(times(sent, held)).toBe(1);
  });
});

describe("a grant left off, from the settings screen", () => {
  it("is refused by lemonfiber, and the refusal is drawn in its words", async () => {
    const refusal =
      "subtitle-fetch asks for sonarr.api_key to fill subtitles, and the yes did not approve it.";
    const sent = fresh();
    settings(sent, {
      "plugin-install": [
        {
          status: 200,
          body: enveloped("plugins", {
            ...readInstall,
            install: wouldInstallGranting,
          }),
        },
        { status: 409, body: refusal },
      ],
    });

    const panel = await screen.findByRole("region", {
      name: m.panel_plugins(),
    });
    await userEvent.type(
      within(panel).getByRole("textbox", { name: m.plug_source() }),
      "subtitle-fetch",
    );
    await userEvent.click(
      within(panel).getByRole("button", { name: m.action_plug_read() }),
    );
    const asked = within(panel).getByRole("status", { name: m.plug_asked() });
    expect(
      await within(asked).findByRole("button", {
        name: m.plug_approve({ approval: crossing.approval }),
      }),
    ).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(
      within(asked).getByRole("button", {
        name: m.action_plug_install_yes({ offer: installOffer }),
      }),
    );

    expect(await within(asked).findByText(refusal)).toBeInTheDocument();
    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/plugin-install",
      body: JSON.stringify({
        source: "subtitle-fetch",
        offer: installOffer,
        approved: [],
      }),
    });
  });
});
