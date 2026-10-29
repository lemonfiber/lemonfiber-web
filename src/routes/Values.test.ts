import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { clearMade, clearRead, setMade, setRead, valuer } from "./valuings";
import {
  clearingCountries,
  clearOffer,
  countries,
  domain,
  madeKey,
  movingTunnel,
  mtu,
  setOffer,
  tunnelKey,
  values,
  vpnType,
} from "../api/values";
import type { Freshness } from "../lib/freshness";
import { unvettedLines } from "../lib/unvetted";
import {
  aboutLines,
  changeLines,
  secretWords,
  valuedLines,
  type Values,
} from "../lib/values";
import type { Valuer } from "../lib/valuing";
import { waitingWords } from "../lib/waiting";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the settings read as given and acting handed this. */
function drawn(
  given: Valuer | undefined,
  read: Reading<Values> | undefined = { ok: true, value: values },
): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    values: read,
    valuer: given,
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.values_title() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.values_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(within(panel()).getByRole("button", { name: label }));

describe("the settings the services read, on the settings screen", () => {
  it("draws each setting with whose it is, what it holds and who reads it", () => {
    drawn(undefined);
    const settings = within(panel()).getByRole("list", {
      name: m.values_settings(),
    });
    for (const one of [domain, vpnType, countries, mtu]) {
      expect(
        within(settings).getByRole("heading", { name: one.name }),
      ).toBeVisible();
      for (const line of aboutLines(one)) {
        expect(within(settings).getAllByText(line)[0]).toBeVisible();
      }
    }
    expect(
      within(settings).getByText("Set to media.example.org"),
    ).toBeVisible();
    expect(within(settings).getByText("lemonfiber's own")).toBeVisible();
    expect(within(panel()).queryAllByRole("button")).toStrictEqual([]);
  });

  it("names every service held back with what it waits for, never pointing at itself", () => {
    drawn(undefined);
    const held = within(panel()).getByRole("region", {
      name: m.waits_title(),
    });
    for (const one of values.waiting) {
      expect(within(held).getByText(waitingWords(one))).toBeVisible();
    }
    expect(panel()).not.toHaveTextContent("Give a setting");
  });

  it("names each secret with whose it is and where its value came from, and takes none", () => {
    drawn(valuer);
    const secrets = within(panel()).getByRole("region", {
      name: m.values_secrets_title(),
    });
    expect(within(secrets).getByText(m.values_secrets_prose())).toBeVisible();
    for (const one of [tunnelKey, madeKey]) {
      expect(
        within(secrets).getByRole("heading", { name: one.name }),
      ).toBeVisible();
      expect(within(secrets).getByText(secretWords(one))).toBeVisible();
    }
    expect(within(secrets).queryByRole("textbox")).toBeNull();
    expect(within(secrets).queryByRole("button")).toBeNull();
  });

  it("says where nothing reads a setting or a secret, and nothing is held back", () => {
    drawn(undefined, {
      ok: true,
      value: { ...values, settings: [], secrets: [], waiting: [] },
    });
    expect(within(panel()).getByText(m.values_none())).toBeVisible();
    expect(within(panel()).getByText(m.values_secrets_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("region", { name: m.waits_title() }),
    ).toBeNull();
    expect(
      within(panel()).queryByRole("list", { name: m.values_settings() }),
    ).toBeNull();
  });

  it("says why the settings could not be read", () => {
    drawn(undefined, {
      ok: false,
      problem: { kind: "unreachable", message: "lemonfiber did not answer." },
    });
    expect(
      within(panel()).getByText("lemonfiber did not answer."),
    ).toBeVisible();
  });

  it("waits for an answer before drawing anything", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });
});

describe("putting a change together", () => {
  it("puts typed and chosen values into one change, and reads them together", async () => {
    const onask = vi.fn();
    drawn({ ...valuer, onask });

    await press(m.action_values_edit({ setting: domain.name }));
    const box = within(panel()).getByRole("textbox", {
      name: m.values_choose({ setting: domain.name }),
    });
    expect(box).toHaveValue("media.example.org");
    await userEvent.clear(box);
    await userEvent.type(box, "tv.example.org");
    await press(m.action_values_add());
    await userEvent.click(
      within(panel()).getAllByRole("radio", { name: "wireguard" })[0] ??
        panel(),
    );

    const change = within(panel()).getByRole("region", {
      name: m.values_draft_title(),
    });
    expect(
      within(change).getByText(
        m.values_draft_line({ setting: domain.name, value: "tv.example.org" }),
      ),
    ).toBeVisible();
    await press(m.action_values_read());

    expect(onask).toHaveBeenCalledWith({
      doing: "settings-set",
      values: {
        LEMONFIBER_DOMAIN: "tv.example.org",
        "gluetun:vpn-type": "wireguard",
      },
    });
    expect(
      within(panel()).queryByRole("region", { name: m.values_draft_title() }),
    ).toBeNull();
  });

  it("takes a setting back out of the change, and leaves a typed value unput", async () => {
    drawn(valuer);

    await press(m.action_values_edit({ setting: countries.name }));
    await press(m.action_leave_as_is());
    expect(
      within(panel()).queryByRole("region", { name: m.values_draft_title() }),
    ).toBeNull();

    await press(m.action_values_edit({ setting: countries.name }));
    await press(m.action_values_add());
    await press(m.action_values_drop({ setting: countries.name }));
    expect(
      within(panel()).queryByRole("region", { name: m.values_draft_title() }),
    ).toBeNull();
  });

  it("starts typing from what was put, from nothing where nothing is recorded, and clears a recorded choice", async () => {
    drawn(valuer, {
      ok: true,
      value: {
        ...values,
        settings: [
          { ...countries, value: null },
          { ...vpnType, value: "wireguard" },
        ],
      },
    });

    await press(m.action_values_edit({ setting: countries.name }));
    const box = within(panel()).getByRole("textbox", {
      name: m.values_choose({ setting: countries.name }),
    });
    expect(box).toHaveValue("");
    await userEvent.type(box, "Belgium");
    await press(m.action_values_add());
    await press(m.action_values_edit({ setting: countries.name }));
    expect(
      within(panel()).getByRole("textbox", {
        name: m.values_choose({ setting: countries.name }),
      }),
    ).toHaveValue("Belgium");

    expect(
      within(panel()).getByRole("radio", { name: "wireguard" }),
    ).toBeChecked();
    expect(
      within(panel()).getByRole("button", {
        name: m.action_values_clear({ setting: vpnType.name }),
      }),
    ).toBeVisible();
  });

  it("offers every declared value, the ones not a choice now too, starting from what is put", async () => {
    drawn(valuer);
    const sizes = within(panel()).getByRole("radiogroup", {
      name: m.values_choose({ setting: mtu.name }),
    });
    expect(within(sizes).getAllByRole("radio")).toHaveLength(2);
    await userEvent.click(within(sizes).getByRole("radio", { name: "1280" }));
    expect(within(sizes).getByRole("radio", { name: "1280" })).toBeChecked();
  });

  it("takes recorded values away together, and offers no clearing where none is", async () => {
    const onask = vi.fn();
    drawn({ ...valuer, onask });

    await press(m.action_values_clear({ setting: countries.name }));
    await press(m.action_values_clear({ setting: domain.name }));
    const away = within(panel()).getByRole("region", {
      name: m.values_clearing_title(),
    });
    expect(
      within(away).getByText(
        m.values_clearing_line({ setting: countries.name }),
      ),
    ).toBeVisible();
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_values_clear({ setting: countries.name }),
      }),
    ).toBeNull();
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_values_clear({ setting: vpnType.name }),
      }),
    ).toBeNull();
    await press(m.action_values_read_clear());

    expect(onask).toHaveBeenCalledWith({
      doing: "settings-clear",
      settings: ["gluetun:countries", "LEMONFIBER_DOMAIN"],
    });
    expect(
      within(panel()).queryByRole("region", {
        name: m.values_clearing_title(),
      }),
    ).toBeNull();
  });

  it("moves a setting between giving and taking away, and out of both", async () => {
    drawn(valuer);

    await press(m.action_values_edit({ setting: countries.name }));
    await press(m.action_values_add());
    await press(m.action_values_clear({ setting: countries.name }));
    expect(
      within(panel()).queryByRole("region", { name: m.values_draft_title() }),
    ).toBeNull();

    await press(m.action_values_edit({ setting: countries.name }));
    await press(m.action_values_add());
    expect(
      within(panel()).queryByRole("region", {
        name: m.values_clearing_title(),
      }),
    ).toBeNull();

    await press(m.action_values_clear({ setting: countries.name }));
    await press(m.action_values_drop({ setting: countries.name }));
    expect(
      within(panel()).queryByRole("region", {
        name: m.values_clearing_title(),
      }),
    ).toBeNull();
  });

  it("silences both readings while something is being asked", async () => {
    drawn({ ...valuer, busy: true });
    await press(m.action_values_edit({ setting: domain.name }));
    await press(m.action_values_add());
    await press(m.action_values_clear({ setting: countries.name }));
    for (const label of [
      m.action_values_read(),
      m.action_values_read_clear(),
    ]) {
      expect(
        within(panel()).getByRole("button", { name: label }),
      ).toHaveAttribute("aria-disabled", "true");
    }
  });
});

describe("what a change would do, and the yes to it", () => {
  it("draws the reading with the overlay above a yes naming it, which moves exactly what was read", async () => {
    const onask = vi.fn();
    drawn({ ...valuer, work: [setRead], onask });

    const reading = within(asked()).getByRole("region", {
      name: m.values_offer_title(),
    });
    expect(
      within(reading).getByText(m.values_offer_prose({ offer: setOffer })),
    ).toBeVisible();
    for (const line of [
      ...changeLines(movingTunnel),
      ...unvettedLines({
        overlay: "/etc/lemonfiber/overlay.yml",
        services: ["gluetun"],
      }),
    ]) {
      expect(within(reading).getByText(line)).toBeVisible();
    }

    await userEvent.click(
      within(reading).getByRole("button", {
        name: m.action_values_yes({ offer: setOffer }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "settings-set",
      values: { "gluetun:vpn-type": "wireguard" },
      offer: setOffer,
    });
  });

  it("clears exactly what was read on a yes naming the reading", async () => {
    const onask = vi.fn();
    drawn({ ...valuer, work: [clearRead], onask });

    const reading = within(asked()).getByRole("region", {
      name: m.values_offer_title(),
    });
    for (const line of changeLines(clearingCountries)) {
      expect(within(reading).getByText(line)).toBeVisible();
    }
    await userEvent.click(
      within(reading).getByRole("button", {
        name: m.action_values_yes({ offer: clearOffer }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "settings-clear",
      settings: ["gluetun:countries"],
      offer: clearOffer,
    });
  });

  it("puts the reading away without writing anything", async () => {
    const ondrop = vi.fn();
    drawn({ ...valuer, work: [setRead], ondrop });

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(ondrop).toHaveBeenCalledWith(setRead.id);
  });

  it("says what each change came to, and puts a record away", async () => {
    const ondrop = vi.fn();
    drawn({ ...valuer, work: [clearMade, setMade], ondrop });

    expect(
      within(asked()).queryByRole("region", { name: m.values_offer_title() }),
    ).toBeNull();
    for (const one of [clearMade, setMade]) {
      if (one.at !== "done" || one.came.kind !== "settings") continue;
      for (const line of valuedLines(one.came.report)) {
        expect(within(asked()).getAllByText(line)[0]).toBeVisible();
      }
    }
    expect(
      within(asked()).getByText(m.doing_values_clear_title()),
    ).toBeVisible();

    const [first] = within(asked()).getAllByRole("button", {
      name: m.action_hide_record(),
    });
    if (first !== undefined) await userEvent.click(first);
    expect(ondrop).toHaveBeenCalledWith(clearMade.id);
  });
});
