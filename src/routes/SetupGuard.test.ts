import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { enveloped, sentTo, walked } from "./setup/Setup.testing";
import { fresh, tunnelling } from "../api/setups";
import { titleOfStep } from "../lib/wizard";
import * as m from "../paraglide/messages.js";

/** The tunnel step's own answer: on to the data folder. */
const onward = { ...fresh, at: "data-location" } as const;

/** The guard's key box, by the secret it asks for. */
const keyBox = (secret: string): HTMLElement =>
  screen.getByLabelText(m.wizard_guard_secret({ secret }));

/** Type into the box a question names. */
const typeInto = async (label: string, text: string): Promise<void> => {
  await userEvent.type(screen.getByLabelText(label), text);
};

/** The refusal of a tunnel answer that left the guard short. */
const short = {
  status: 400,
  text: enveloped("error", {
    code: "SETUP-16",
    summary: "The VPN answer leaves out a setting the egress guard needs.",
    meaning: "Nothing was recorded.",
    remedies: [],
    severity: "error",
    state: "actionable",
  }),
};

beforeEach(() => {
  globalThis.history.replaceState(undefined, "", "/");
});

describe("what the tunnel step asks of the egress guard", () => {
  it("asks the type, then the provider, then what they need, and sends exactly that", async () => {
    const { sent } = walked({
      "/api/setup": tunnelling,
      "/api/setup/answer": onward,
    });
    await screen.findByRole("heading", { name: titleOfStep("vpn") });
    expect(screen.getByText(m.wizard_guard_prose())).toBeVisible();
    expect(screen.getByRole("radio", { name: "wireguard" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "privado" })).toBeNull();
    expect(screen.getByText(m.wizard_guard_missing())).toBeVisible();

    await userEvent.click(screen.getByRole("radio", { name: "custom" }));
    await typeInto(
      m.wizard_guard_value({ setting: "gluetun:addresses" }),
      "198.51.100.2/32",
    );
    await typeInto(
      m.wizard_guard_value({ setting: "gluetun:endpoint-ip" }),
      "192.0.2.1",
    );
    expect(keyBox("wireguard-key")).toHaveAttribute("type", "password");
    await userEvent.type(keyBox("wireguard-key"), "a key");
    await userEvent.click(
      screen.getByRole("button", { name: m.action_wizard_continue() }),
    );

    await screen.findByRole("heading", { name: titleOfStep("data-location") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      JSON.stringify({
        vpn: {
          carrying: {
            settings: {
              "gluetun:vpn-type": "wireguard",
              "gluetun:provider": "custom",
              "gluetun:addresses": "198.51.100.2/32",
              "gluetun:endpoint-ip": "192.0.2.1",
            },
            secrets: { "wireguard-key": "a key" },
          },
        },
      }),
    ]);
  });

  it("moves what it asks as the answers change", async () => {
    walked({ "/api/setup": tunnelling });
    await screen.findByRole("heading", { name: titleOfStep("vpn") });

    await userEvent.click(screen.getByRole("radio", { name: "openvpn" }));
    expect(screen.getByRole("radio", { name: "privado" })).toBeVisible();
    expect(screen.queryByRole("radio", { name: "custom" })).toBeNull();
    expect(
      screen.queryByLabelText(
        m.wizard_guard_value({ setting: "gluetun:addresses" }),
      ),
    ).toBeNull();
    expect(keyBox("openvpn-password")).toBeVisible();

    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_vpn_absent() }),
    );
    expect(screen.queryByText(m.wizard_guard_prose())).toBeNull();
    expect(screen.getByText(m.wizard_missing_understood())).toBeVisible();
  });

  it("says a refused answer in its own words, and lets go of the key it carried", async () => {
    walked({ "/api/setup": tunnelling, "/api/setup/answer": short });
    await screen.findByRole("heading", { name: titleOfStep("vpn") });

    await userEvent.click(screen.getByRole("radio", { name: "mullvad" }));
    await typeInto(
      m.wizard_guard_value({ setting: "gluetun:addresses" }),
      "198.51.100.2/32",
    );
    await userEvent.type(keyBox("wireguard-key"), "a key");
    await userEvent.click(
      screen.getByRole("button", { name: m.action_wizard_continue() }),
    );

    const status = screen.getByRole("status", { name: m.wizard_asked() });
    expect(
      await within(status).findByText(m.wizard_guard_unanswered()),
    ).toBeVisible();
    expect(keyBox("wireguard-key")).toHaveValue("");
    expect(screen.getByRole("radio", { name: "mullvad" })).toBeChecked();
  });
});
