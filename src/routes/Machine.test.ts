import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { everySetting } from "../api/configs";
import {
  certificate,
  servedEncrypted,
  servedHere,
  servedPlain,
  settledDone,
  shipped,
} from "../api/machines";
import { coversLine, decisionLines } from "../lib/configured";
import type { Freshness } from "../lib/freshness";
import { settledReadout, stackReadout } from "../lib/machine";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

const region = (name: string): HTMLElement =>
  screen.getByRole("region", { name });

describe("how this machine stands, on the settings screen", () => {
  it("is not drawn until it answers, and raises no alarm", () => {
    render(Settings, { quality: undefined, freshness: answered });
    for (const name of [m.panel_served(), m.panel_stack(), m.panel_settled()]) {
      expect(screen.queryByRole("region", { name })).toBeNull();
    }
    expect(screen.queryByText(m.served_alarm_lead())).toBeNull();
  });

  it("shows the console's certificate fingerprint in full beside the sentence asking to compare it", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      served: { ok: true, value: servedEncrypted },
    });
    const console_ = within(region(m.panel_served()));
    expect(
      console_.getByText(
        m.served_fingerprint({ fingerprint: certificate.fingerprint }),
      ),
    ).toBeVisible();
    expect(console_.getByText(m.served_compare())).toBeVisible();
    expect(screen.queryByText(m.served_alarm_lead())).toBeNull();
  });

  it("raises an alarm where the console is served without encryption to the network", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      served: { ok: true, value: servedPlain },
    });
    expect(screen.getByText(m.served_alarm_lead())).toBeVisible();
    expect(
      within(region(m.panel_served())).getByText(m.served_plain_network()),
    ).toBeVisible();
  });

  it("raises no alarm where the console is served without encryption to this machine alone", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      served: { ok: true, value: servedHere },
    });
    expect(screen.queryByText(m.served_alarm_lead())).toBeNull();
  });

  it("raises no alarm where how the console is served could not be read", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      served: {
        ok: false,
        problem: { kind: "unreachable", message: "lemonfiber did not answer." },
      },
    });
    expect(
      within(region(m.panel_served())).getByText("lemonfiber did not answer."),
    ).toBeVisible();
    expect(screen.queryByText(m.served_alarm_lead())).toBeNull();
  });

  it("hands over the words that start the stack without lemonfiber, and what setup settled", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      stack: { ok: true, value: shipped },
      settled: { ok: true, value: settledDone },
    });
    const start = within(region(m.panel_stack())).getByRole("figure", {
      name: m.stack_up(),
    });
    expect(start).toHaveTextContent(
      stackReadout(shipped).commands?.[0]?.text ?? "",
    );
    for (const line of settledReadout(settledDone).lines) {
      expect(within(region(m.panel_settled())).getByText(line)).toBeVisible();
    }
  });

  it("draws a refusal to say how the stack runs in the stack's words", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      stack: {
        ok: false,
        problem: {
          kind: "refused",
          message: "The stack folder could not be read.",
        },
      },
    });
    const told = within(region(m.panel_stack()));
    expect(told.getByText("The stack folder could not be read.")).toBeVisible();
    expect(told.queryByText(m.stack_bundled())).toBeNull();
  });
});

describe("setup choices and what is left alone, in every setting", () => {
  it("lists each choice without its value, and each area left alone with its reason and what it covers", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      settings: { ok: true, value: everySetting },
    });
    const panel = within(region(m.panel_config()));
    for (const decision of everySetting.decisions) {
      for (const line of decisionLines(decision, m.values_title())) {
        expect(panel.getAllByText(line).length).toBeGreaterThan(0);
      }
    }
    for (const area of everySetting.unmanaged) {
      expect(panel.getByText(area.why)).toBeVisible();
      expect(panel.getAllByText(coversLine(area)).length).toBeGreaterThan(0);
    }
  });

  it("shows no such lists where nothing is declared, and counts areas left out", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      settings: {
        ok: true,
        value: { ...everySetting, decisions: [], unmanaged: [] },
      },
    });
    expect(
      screen.queryByRole("heading", { name: m.decision_heading() }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: m.unmanaged_heading() }),
    ).toBeNull();
  });

  it("shows no such lists where the settings could not be read", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      settings: { ok: false, problem: { kind: "refused", message: "No." } },
    });
    expect(
      screen.queryByRole("heading", { name: m.decision_heading() }),
    ).toBeNull();
  });

  it("says how many more areas are declared than listed", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      settings: { ok: true, value: { ...everySetting, unmanaged_more: 2 } },
    });
    expect(screen.getByText(m.unmanaged_more({ count: 2 }))).toBeVisible();
  });
});
