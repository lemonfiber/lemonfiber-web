import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { console_ } from "./Console.testing";
import { enveloped, fresh, stack, type Asked, type Says } from "./served";
import {
  account,
  passphrase,
  proveOffer,
  proved,
  ran,
  readProve,
  readRun,
  refresh,
  refreshables,
  runOffer,
} from "../api/proofs";
import { released } from "../api/plugs";
import * as m from "../paraglide/messages.js";

/** What is typed for the input that may be secret. */
const typed = "letters-typed-hidden";

/** The settings screen, the fetcher able to be refreshed, its acts answering as told. */
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
          "/api/plugins": {
            status: 200,
            body: enveloped("plugins", refreshables),
          },
        },
      },
      asked,
    ),
    pausing: () => Promise.resolve(),
  });
}

/** The plugins panel, once it has drawn the fetcher. */
async function panel(): Promise<HTMLElement> {
  const found = await screen.findByRole("region", {
    name: m.panel_plugins(),
  });
  await within(found).findByRole("list", { name: m.plugin_said() });
  return found;
}

describe("proving a plugin again, from the settings screen", () => {
  it("reads what it would ask first, and proves on a yes carrying that reading", async () => {
    const sent = fresh();
    settings(sent, {
      "plugin-prove": [
        { status: 200, body: enveloped("plugins", readProve) },
        { status: 200, body: enveloped("plugins", proved) },
      ],
    });
    const found = await panel();
    await userEvent.click(
      within(found).getByRole("button", {
        name: m.action_plug_prove({ name: "Subtitle fetch" }),
      }),
    );
    const asked = within(found).getByRole("status", { name: m.plug_asked() });
    await userEvent.click(
      await within(asked).findByRole("button", {
        name: m.action_plug_prove_yes({ offer: proveOffer }),
      }),
    );

    expect(
      await within(asked).findByText(
        m.plug_reproof_cleared({ plugin: "subtitle-fetch" }),
      ),
    ).toBeVisible();
    expect(sent.posted.map((one) => one.body)).toStrictEqual([
      JSON.stringify({ plugin: "subtitle-fetch" }),
      JSON.stringify({ plugin: "subtitle-fetch", offer: proveOffer }),
    ]);
  });
});

describe("a proving whose reading has moved, from the settings screen", () => {
  it("draws lemonfiber's refusal in its words, and proves nothing", async () => {
    const refusal =
      "subtitle-fetch was read as plugin-prove:1a2b, and what it proves has moved since.";
    const sent = fresh();
    settings(sent, {
      "plugin-prove": [
        { status: 200, body: enveloped("plugins", readProve) },
        { status: 409, body: refusal },
      ],
    });
    const found = await panel();
    await userEvent.click(
      within(found).getByRole("button", {
        name: m.action_plug_prove({ name: "Subtitle fetch" }),
      }),
    );
    const asked = within(found).getByRole("status", { name: m.plug_asked() });
    await userEvent.click(
      await within(asked).findByRole("button", {
        name: m.action_plug_prove_yes({ offer: proveOffer }),
      }),
    );

    expect(await within(asked).findByText(refusal)).toBeVisible();
    expect(
      within(asked).queryByText(
        m.plug_reproof_cleared({ plugin: "subtitle-fetch" }),
      ),
    ).toBeNull();
    expect(
      within(asked).queryByRole("button", {
        name: m.action_plug_prove_yes({ offer: proveOffer }),
      }),
    ).toBeNull();
  });
});

describe("running a recipe by name, from the settings screen", () => {
  it("sends what was typed for each input with the yes, and keeps none of it once sent", async () => {
    const sent = fresh();
    settings(sent, {
      "plugin-run": [
        { status: 200, body: enveloped("plugins", readRun) },
        { status: 200, body: enveloped("plugins", ran) },
      ],
    });
    const found = await panel();
    await userEvent.click(
      within(found).getByRole("button", {
        name: m.action_plug_run({ recipe: refresh.title }),
      }),
    );
    const asked = within(found).getByRole("status", { name: m.plug_asked() });
    await userEvent.type(
      await within(asked).findByRole("textbox", { name: account.ask }),
      "household",
    );
    await userEvent.type(within(asked).getByLabelText(passphrase.ask), typed);
    await userEvent.click(
      within(asked).getByRole("button", {
        name: m.plug_approve({ approval: released.approval ?? "" }),
      }),
    );
    await userEvent.click(
      within(asked).getByRole("button", {
        name: m.action_plug_run_yes({ offer: runOffer }),
      }),
    );

    expect(
      await within(asked).findByText(
        m.plug_recipe_held({ recipe: refresh.title }),
      ),
    ).toBeVisible();
    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/plugin-run",
      body: JSON.stringify({
        plugin: "subtitle-fetch",
        recipe: "refresh",
        offer: runOffer,
        approved: [released.approval],
        inputs: ["account=household", `passphrase=${typed}`],
      }),
    });
    expect(document.body.innerHTML).not.toContain(typed);
    expect(globalThis.location.href).not.toContain(typed);
  });
});
