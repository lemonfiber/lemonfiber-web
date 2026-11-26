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
  heldBack,
  inForce,
  reapplied,
  recyclarr,
  wouldChoose,
  wouldReapply,
} from "../api/qualities";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the quality in force. */
const quality = "/api/quality";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

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

  it("reads what putting it back would replace first, and replaces nothing yet", async () => {
    const sent = fresh();
    tuning(sent, {}, [
      { status: 200, body: enveloped("quality", wouldReapply) },
    ]);
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());

    expect(
      await within(asked()).findByText(
        m.came_quality_overwritten({ path: recyclarr }),
      ),
    ).toBeInTheDocument();
    expect(within(asked()).getByText(m.quality_reapply_title())).toBeVisible();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/quality-reapply",
        body: JSON.stringify({ dry_run: true }),
      },
    ]);
    expect(times(sent, quality)).toBe(1);
  });

  it("puts it back on a yes under what was read, and reads the choice again", async () => {
    const sent = fresh();
    tuning(sent, {}, [
      { status: 200, body: enveloped("quality", wouldReapply) },
      { status: 200, body: enveloped("quality", reapplied) },
    ]);
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());
    await within(asked()).findByText(m.quality_reapply_title());
    await press(m.action_reapply_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/quality-reapply",
        body: JSON.stringify({ dry_run: true }),
      },
      { at: "/api/actions/quality-reapply", body: "{}" },
    ]);
    await waitFor(() => {
      expect(times(sent, quality)).toBe(2);
    });
    expect(within(asked()).queryByText(m.quality_reapply_title())).toBeNull();
  });

  it("chooses from what the reading offers, reads the choice first, and uses it on a yes", async () => {
    const sent = fresh();
    tuning(sent, {}, [
      { status: 200, body: enveloped("quality", wouldChoose) },
      { status: 200, body: enveloped("quality", inForce) },
    ]);
    await screen.findByText(m.action_quality_choose());
    await press(m.action_quality_choose());
    await userEvent.click(screen.getByRole("radio", { name: "movies" }));
    await userEvent.click(screen.getByRole("radio", { name: "maximum" }));
    await press(m.action_quality_read());
    await within(asked()).findByText(m.quality_choice_title());
    expect(within(asked()).getByText(m.quality_choice_prose())).toBeVisible();
    await press(m.action_quality_use());

    const movies = { preset: "maximum", media_type: "movies" };
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/quality-set",
        body: JSON.stringify({ ...movies, dry_run: true }),
      },
      { at: "/api/actions/quality-set", body: JSON.stringify(movies) },
    ]);
    await waitFor(() => {
      expect(times(sent, quality)).toBe(2);
    });
  });

  it("offers music its formats, and a choice the stack held only anyway", async () => {
    const sent = fresh();
    tuning(sent, {}, [
      { status: 200, body: enveloped("quality", heldBack) },
      { status: 200, body: enveloped("quality", inForce) },
    ]);
    await screen.findByText(m.action_quality_choose());
    await press(m.action_quality_choose());
    await userEvent.click(screen.getByRole("radio", { name: "music" }));
    expect(screen.queryByRole("radio", { name: "maximum" })).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "lossless" }));
    await press(m.action_quality_read());
    await within(asked()).findByText(m.quality_choice_held());
    await press(m.action_quality_anyway());

    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/quality-set",
      body: JSON.stringify({
        preset: "lossless",
        media_type: "music",
        confirm: true,
      }),
    });
  });

  it("chooses for everything, and puts a choice away unused", async () => {
    const sent = fresh();
    tuning(sent, {}, [
      { status: 200, body: enveloped("quality", wouldChoose) },
    ]);
    await screen.findByText(m.action_quality_choose());
    await press(m.action_quality_choose());
    expect(
      screen.getByRole("button", { name: m.action_quality_read() }),
    ).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(screen.getByRole("radio", { name: "balanced" }));
    await press(m.action_quality_read());
    await within(asked()).findByText(m.quality_choice_title());
    await press(m.action_leave_as_is());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/quality-set",
        body: JSON.stringify({ preset: "balanced", dry_run: true }),
      },
    ]);
    expect(within(asked()).queryByText(m.quality_choice_title())).toBeNull();
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

  it("puts a record away when asked, and leaving puts away what was read", async () => {
    tuning(
      fresh(),
      {
        "quality-upgrade": [
          { status: 200, body: enveloped("upgrade", costed) },
        ],
      },
      [{ status: 200, body: enveloped("quality", wouldReapply) }],
    );
    await screen.findByText(m.action_reapply());
    await press(m.action_reapply());
    await within(asked()).findByText(m.quality_reapply_title());
    await press(m.action_leave_as_is());
    expect(screen.queryByText(m.quality_reapply_title())).toBeNull();

    await press(m.action_upgrade_cost());
    await within(asked()).findByText(m.doing_upgrade_title());
    await press(m.action_hide_record());

    expect(within(asked()).queryByText(m.doing_upgrade_title())).toBeNull();
  });
});
