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
import {
  costed,
  fetched,
  inForce,
  reapplied,
  recyclarr,
} from "../api/qualities";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the quality in force. */
const quality = "/api/quality";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/**
 * The settings screen, against a stack whose quality actions answer as they
 * are told and whose work becomes what it is given.
 */
function tuning(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>> = {},
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting,
      becoming,
      reading: {
        [quality]: { status: 200, body: enveloped("quality", inForce) },
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

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.quality_asked() });

describe("the quality, from the settings screen", () => {
  it("reads the choice in force on the way in", async () => {
    const sent = fresh();
    tuning(sent);

    expect(
      await screen.findByText(
        m.quality_choice({ scope: "everything", preset: "balanced" }),
      ),
    ).toBeInTheDocument();
    expect(times(sent, quality)).toBe(1);
  });

  it("says the edits are lost before the yes, and sends nothing yet", async () => {
    const sent = fresh();
    tuning(sent);
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());

    expect(
      within(asked()).getByText(m.confirm_reapply_prose()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([]);
  });

  it("puts it back on a yes, lists what it replaced, and reads the choice again", async () => {
    const sent = fresh();
    tuning(sent, {}, [{ status: 200, body: enveloped("quality", reapplied) }]);
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());
    await press(m.action_reapply_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/quality-reapply", body: "{}" },
    ]);
    expect(
      await within(asked()).findByText(
        m.came_quality_overwritten({ path: recyclarr }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(times(sent, quality)).toBe(2);
    });
  });

  // The fetching is still under way the first time it is asked after, and is
  // followed until it ends.
  it("reads what fetching again would cost first, and fetches on a yes under it", async () => {
    const sent = fresh();
    tuning(
      sent,
      {
        "quality-upgrade": [
          { status: 200, body: enveloped("upgrade", costed) },
          started,
        ],
      },
      [started, { status: 200, body: enveloped("upgrade", fetched) }],
    );
    await screen.findByText(m.action_upgrade_cost());

    await press(m.action_upgrade_cost());
    await within(asked()).findByText(m.quality_cost_title());
    await press(m.action_upgrade_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/quality-upgrade", body: "{}" },
      {
        at: "/api/actions/quality-upgrade",
        body: JSON.stringify({ confirm: true }),
      },
    ]);
    expect(
      await within(asked()).findByText(
        m.came_upgrade_failed({
          kind: "movies",
          detail: "Radarr did not answer.",
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.quality_cost_title())).toBeNull();
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const busy = "The quality config is being written by another run.";
    tuning(fresh(), { "quality-upgrade": [{ status: 409, body: busy }] });
    await screen.findByText(m.action_upgrade_cost());

    await press(m.action_upgrade_cost());

    expect(await within(asked()).findByText(busy)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });

  it("puts a record away when asked, and the leaving withdraws the question", async () => {
    tuning(fresh(), {
      "quality-upgrade": [{ status: 200, body: enveloped("upgrade", costed) }],
    });
    await screen.findByText(m.action_reapply());
    await press(m.action_reapply());
    await press(m.action_leave_as_is());
    expect(screen.queryByText(m.confirm_reapply_prose())).toBeNull();

    await press(m.action_upgrade_cost());
    await within(asked()).findByText(m.doing_upgrade_title());
    await press(m.action_hide_record());

    expect(within(asked()).queryByText(m.doing_upgrade_title())).toBeNull();
  });
});
