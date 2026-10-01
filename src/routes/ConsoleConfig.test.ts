import { render, screen, waitFor, within } from "@testing-library/svelte";
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
  started,
  times,
  type Asked,
  type Says,
} from "./served";
import { applied, everySetting, madeAtOnce, staged } from "../api/configs";
import { inForce } from "../api/qualities";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads every setting. */
const settings = "/api/config";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/**
 * The settings screen, against a stack that answers each change as it is told
 * and whose work becomes what it is given.
 */
function configuring(
  asked: Asked,
  changing: readonly Says[],
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting: { "config-set": changing },
      becoming,
      reading: {
        [settings]: { status: 200, body: enveloped("config", everySetting) },
        "/api/quality": { status: 200, body: enveloped("quality", inForce) },
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

/** What each change carried, in the order it was sent. */
const bodies = (asked: Asked): readonly (string | undefined)[] =>
  asked.posted.map((one) => one.body);

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.config_asked() });

/** Give one setting a new value and ask. */
async function change(setting: string, value: string): Promise<void> {
  const edit = m.action_config_edit({ key: setting });
  await screen.findByText(edit);
  await press(edit);
  const box = screen.getByLabelText(m.config_new_value({ key: setting }));
  await userEvent.clear(box);
  await userEvent.type(box, value);
  await press(m.action_config_change());
}

describe("changing a setting from the settings screen", () => {
  it("makes a change that costs nothing at once, and reads the settings again", async () => {
    const sent = fresh();
    configuring(sent, [{ status: 200, body: enveloped("config", madeAtOnce) }]);

    await change("port_forwarding", "off");

    expect(bodies(sent)).toStrictEqual([
      JSON.stringify({ key: "port_forwarding", value: "off" }),
    ]);
    expect(
      await within(asked()).findByText(
        m.came_config_applied({
          key: "port_forwarding",
          from: "on",
          to: "off",
        }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(times(sent, settings)).toBe(2);
    });
  });

  it("shows the review of one that costs something, and makes it on the yes", async () => {
    const sent = fresh();
    configuring(
      sent,
      [{ status: 200, body: enveloped("config", staged) }, started],
      [{ status: 200, body: enveloped("config", applied) }],
    );

    await change("data_location", "/mnt/media");
    await within(asked()).findByText(
      m.config_review_title({ key: "data_location" }),
    );
    await press(m.config_wait());
    await press(m.action_config_yes({ key: "data_location" }));

    expect(bodies(sent)).toStrictEqual([
      JSON.stringify({ key: "data_location", value: "/mnt/media" }),
      JSON.stringify({
        key: "data_location",
        value: "/mnt/media",
        confirm: true,
        wait: true,
      }),
    ]);
    expect(
      await within(asked()).findByText(
        m.came_config_applied({
          key: "data_location",
          from: "/srv/media",
          to: "/mnt/media",
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(m.config_review_title({ key: "data_location" })),
    ).toBeNull();
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const unknown = "There is no setting called port_forwarding here.";
    configuring(fresh(), [{ status: 400, body: unknown }]);

    await change("port_forwarding", "off");

    expect(await within(asked()).findByText(unknown)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
