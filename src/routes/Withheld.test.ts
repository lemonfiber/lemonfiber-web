import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Requests from "./Requests.svelte";
import Settings from "./Settings.svelte";
import Limiting from "./panels/Limiting.svelte";
import { configurer, everySetting } from "./configured";
import { household } from "./house";
import { shared, sharer } from "./lined";
import { handedKit, tender } from "./tended";
import { valuer } from "./valuings";
import { readerAble } from "../api/abilities.testing";
import { countries, values, vpnType } from "../api/values";
import { ABLE } from "../components/able";
import type { Freshness } from "../lib/freshness";
import { nameOfRequest } from "../lib/standing";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 4 };

/** What is held beneath a key that reads everything and acts on nothing. */
const reader = new Map([[ABLE, () => readerAble]]);

const button = (label: string): HTMLElement | null =>
  screen.queryByRole("button", { name: label });

describe("for a key that acts on nothing", () => {
  it("offers no setting to change", () => {
    render(Settings, {
      context: reader,
      props: {
        quality: undefined,
        freshness: answered,
        settings: { ok: true, value: everySetting },
        configurer,
      },
    });
    expect(
      screen.getByRole("region", { name: m.panel_config() }),
    ).toHaveTextContent("data_location");
    expect(button(m.action_config_edit({ key: "data_location" }))).toBeNull();
  });

  it("offers no value to type, choose or take away", () => {
    render(Settings, {
      context: reader,
      props: {
        quality: undefined,
        freshness: answered,
        values: { ok: true, value: values },
        valuer,
      },
    });
    expect(screen.getByRole("heading", { name: countries.name })).toBeVisible();
    expect(
      button(m.action_values_edit({ setting: countries.name })),
    ).toBeNull();
    expect(
      button(m.action_values_clear({ setting: countries.name })),
    ).toBeNull();
    expect(
      screen.queryByRole("radiogroup", {
        name: m.values_choose({ setting: vpnType.name }),
      }),
    ).toBeNull();
  });

  it("draws no declaring or lifting, even before anything is typed", () => {
    render(Settings, {
      context: reader,
      props: {
        quality: undefined,
        freshness: answered,
        line: { ok: true, value: shared },
        sharer,
      },
    });
    expect(screen.getByLabelText(m.line_minutes())).toBeVisible();
    expect(button(m.action_line_declare())).toBeNull();
    expect(button(m.action_line_lift())).toBeNull();
  });

  it("opens no invitation, no limits and no refusal, and hands nobody a device", () => {
    const [, kit] = household.members;
    const waiting = kit?.requests.find(
      (request) => request.state === "waiting-for-approval",
    );
    expect(waiting).toBeDefined();
    const title = waiting === undefined ? "" : nameOfRequest(waiting);
    render(Requests, {
      context: reader,
      props: {
        household: { ok: true, value: household },
        freshness: answered,
        tender: { ...tender, work: [handedKit] },
      },
    });
    expect(document.body).toHaveTextContent(title);
    expect(
      screen.getByRole("region", { name: m.handoff_said({ name: "Kit" }) }),
    ).toBeVisible();
    for (const label of [
      m.action_invite_open(),
      m.action_limits_house(),
      m.action_limits_member({ name: "Kit" }),
      m.action_decline_open({ title }),
      m.action_handoff({ name: "Kit" }),
      m.action_handoff_again({ name: "Kit" }),
    ])
      expect(button(label)).toBeNull();
  });

  it("keeps no limits, typed or not", async () => {
    render(Limiting, {
      context: reader,
      props: {
        name: "Kit",
        policy: "within-a-limit",
        busy: false,
        onkeep: () => undefined,
        onleave: () => undefined,
      },
    });
    expect(button(m.action_limits_keep())).toBeNull();
    await userEvent.type(screen.getByLabelText(m.limits_requests()), "3");
    await userEvent.type(screen.getByLabelText(m.limits_days()), "7");
    expect(button(m.action_limits_keep())).toBeNull();
    expect(button(m.action_leave_as_is())).toBeVisible();
  });
});
