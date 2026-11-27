import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { console_, routed } from "./Console.testing";
import { enveloped } from "./served";
import { refusedAs } from "../api/bodies";
import { inForce } from "../api/qualities";
import { readKeyAble } from "../api/abilities.testing";
import { nameOf } from "../lib/route";
import * as m from "../paraglide/messages.js";

/** What lemonfiber says to a key at a read it may not use. */
const notForAKey = "A key may not read every setting.";

/** A read key's console: what it can use, the quality it may read and the settings it may not. */
const answers = {
  "GET /api/capabilities": enveloped("capabilities", readKeyAble),
  "GET /api/quality": enveloped("quality", inForce),
  "GET /api/config": {
    status: 403,
    body: refusedAs("NOT_FOR_A_KEY", notForAKey),
  },
};

describe("what the signed-in key can use", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/settings");
  });

  it("is read once for the session, however many screens are opened", async () => {
    const asked: string[] = [];
    console_({ sending: routed(answers, asked) });
    await screen.findByRole("region", { name: m.panel_quality() });
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("checks")) }),
    );
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("settings")) }),
    );
    await screen.findByRole("region", { name: m.panel_quality() });
    expect(asked.filter((one) => one === "GET /api/capabilities")).toHaveLength(
      1,
    );
  });

  it("silences a panel whose read the key may not use, in lemonfiber's sentence", async () => {
    console_({ sending: routed(answers, []) });
    const panel = await screen.findByRole("region", {
      name: m.panel_config(),
    });
    expect(await within(panel).findByText(notForAKey)).toBeVisible();
    expect(panel).not.toHaveTextContent(m.config_prose());
    expect(within(panel).queryByRole("button")).toBeNull();
  });

  it("draws no control asking for an action the key may not use", async () => {
    console_({ sending: routed(answers, []) });
    const panel = await screen.findByRole("region", {
      name: m.panel_quality(),
    });
    await within(panel).findAllByText(/balanced/);
    expect(
      within(panel).queryByRole("button", {
        name: m.action_quality_choose(),
      }),
    ).toBeNull();
  });
});
