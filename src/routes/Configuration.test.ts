import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import {
  changedAtOnce,
  configurer,
  everySetting,
  stagedChange,
} from "./configured";
import { inForce } from "./tuned";
import type { Configured } from "../lib/configured";
import type { Configurer } from "../lib/configuring";
import type { Freshness } from "../lib/freshness";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 6 };

/** The settings screen, with what can be asked about every setting. */
function configuring(
  over: Partial<Configurer> = {},
  settings: Reading<Configured> = { ok: true, value: everySetting },
): void {
  render(Settings, {
    quality: { ok: true, value: inForce },
    settings,
    freshness: answered,
    configurer: { ...configurer, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_config() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.config_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("every setting", () => {
  it("lists each by name, with its value and where it came from", () => {
    configuring();
    const list = within(panel()).getByRole("list", {
      name: m.config_settings(),
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("/srv/media")).toBeInTheDocument();
    expect(
      within(list).getByText(m.config_origin_bundled()),
    ).toBeInTheDocument();
  });

  it("draws the settings alone where nothing answers", () => {
    render(Settings, {
      quality: undefined,
      settings: { ok: true, value: everySetting },
      freshness: answered,
    });
    expect(
      screen.queryByRole("button", {
        name: m.action_config_edit({ key: "data_location" }),
      }),
    ).toBeNull();
  });

  it("says why they could not be read, and waits for an answer not come", () => {
    configuring(
      {},
      {
        ok: false,
        problem: {
          kind: "unreachable",
          message: "lemonfiber is not answering.",
        },
      },
    );
    expect(
      within(panel()).getByText("lemonfiber is not answering."),
    ).toBeInTheDocument();
  });

  it("waits for an answer that has not come", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });
});

describe("changing a setting", () => {
  it("starts from the value in force, and asks with the value typed", async () => {
    const onask = vi.fn();
    configuring({ onask });

    await press(m.action_config_edit({ key: "data_location" }));
    const box = screen.getByLabelText(
      m.config_new_value({ key: "data_location" }),
    );
    expect(box).toHaveValue("/srv/media");
    await userEvent.clear(box);
    await userEvent.type(box, "/mnt/media");
    await press(m.action_config_change());

    expect(onask).toHaveBeenCalledWith({
      doing: "config-set",
      key: "data_location",
      value: "/mnt/media",
    });
    expect(asked()).toHaveFocus();
  });

  // A withheld value is not put in the box, and the box hides what is typed.
  it("puts nothing withheld in the box, and hides what is typed", async () => {
    configuring();

    await press(m.action_config_edit({ key: "usenet_password" }));

    const box = screen.getByLabelText(
      m.config_new_value({ key: "usenet_password" }),
    );
    expect(box).toHaveValue("");
    expect(box).toHaveAttribute("type", "password");
  });

  it("puts the box away when it is left as it is", async () => {
    const onask = vi.fn();
    configuring({ onask });

    await press(m.action_config_edit({ key: "port_forwarding" }));
    await press(m.action_leave_as_is());

    expect(
      screen.queryByLabelText(m.config_new_value({ key: "port_forwarding" })),
    ).toBeNull();
    expect(onask).not.toHaveBeenCalled();
  });

  it("is silenced while a request is in flight", () => {
    configuring({ busy: true });
    expect(
      screen.getByRole("button", {
        name: m.action_config_edit({ key: "data_location" }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});

describe("a change that costs something", () => {
  it("shows the review, and the yes is the same change confirmed", async () => {
    const onask = vi.fn();
    configuring({ work: [stagedChange], onask });

    expect(
      within(asked()).getByRole("heading", {
        name: m.config_review_title({ key: "data_location" }),
      }),
    ).toBeInTheDocument();
    expect(
      within(asked()).getByText(
        "Moving the library takes as long as copying it.",
      ),
    ).toBeInTheDocument();

    await press(m.action_config_yes({ key: "data_location" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "config-set",
      key: "data_location",
      value: "/mnt/media",
      confirm: true,
      wait: false,
    });
    expect(asked()).toHaveFocus();
  });

  // What is still coming down is interrupted by the change unless it is let
  // finish, and the yes carries which.
  it("carries letting what is coming down finish first, where chosen", async () => {
    const onask = vi.fn();
    configuring({ work: [stagedChange], onask });

    await press(m.config_wait());
    await press(m.action_config_yes({ key: "data_location" }));

    expect(onask).toHaveBeenCalledWith(expect.objectContaining({ wait: true }));
  });

  it("offers no waiting under a review where nothing is coming down", () => {
    const quiet: Work = {
      ...stagedChange,
      id: "43",
      at: "done",
      job: undefined,
      came: {
        kind: "config",
        report: {
          ...everySetting,
          review: {
            change: { cost: "consequential", key: "data_location", to: "/x" },
            stance: "pending",
          },
        },
      },
    };
    configuring({ work: [quiet] });
    expect(
      within(asked()).getByRole("heading", {
        name: m.config_review_title({ key: "data_location" }),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: m.config_wait() })).toBeNull();
  });

  it("offers no waiting where nothing is coming down", () => {
    configuring({ work: [changedAtOnce] });
    expect(screen.queryByRole("button", { name: m.config_wait() })).toBeNull();
    expect(
      within(asked()).getByText(
        m.came_config_applied({
          key: "port_forwarding",
          from: "on",
          to: "off",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("puts the review away when it is left, and a record when asked", async () => {
    const ondrop = vi.fn();
    configuring({ work: [stagedChange], ondrop });

    await press(m.action_leave_as_is());
    expect(ondrop).toHaveBeenCalledWith(stagedChange.id);
    await press(m.action_hide_record());
    expect(ondrop).toHaveBeenCalledTimes(2);
  });

  it("stands still where nothing answers what is pressed", async () => {
    configuring();
    await press(m.action_config_edit({ key: "data_location" }));
    await press(m.action_config_change());
    expect(within(asked()).queryByRole("heading")).toBeNull();
  });
});
