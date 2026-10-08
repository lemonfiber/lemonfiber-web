import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { catalogue, provenance } from "../api/catalogues";
import {
  droppedLine,
  serviceLines,
  type Catalogue,
  type Provenance,
} from "../lib/catalogue";
import type { Freshness } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with what the stack holds read. */
function reading(
  read: {
    catalogue?: Reading<Catalogue>;
    provenance?: Reading<Provenance>;
  } = {},
): void {
  render(Settings, { quality: undefined, freshness: answered, ...read });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_catalogue() });

describe("what the stack holds, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading();
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names every service with what it is for and where it comes from", () => {
    reading({
      catalogue: { ok: true, value: catalogue },
      provenance: { ok: true, value: provenance },
    });
    const services = within(panel()).getByRole("list", {
      name: m.catalogue_said(),
    });
    for (const service of catalogue.services) {
      expect(
        within(services).getByRole("heading", { name: service.name }),
      ).toBeVisible();
      for (const line of serviceLines(service, provenance)) {
        expect(within(services).getAllByText(line).length).toBeGreaterThan(0);
      }
    }
  });

  it("names every service the stack dropped", () => {
    reading({ catalogue: { ok: true, value: catalogue } });
    const dropped = within(panel()).getByRole("region", {
      name: m.catalogue_dropped_said(),
    });
    for (const one of catalogue.removed) {
      expect(within(dropped).getByText(droppedLine(one))).toBeVisible();
    }
  });

  it("says so where the stack holds nothing and has dropped nothing", () => {
    reading({ catalogue: { ok: true, value: { services: [], removed: [] } } });
    expect(within(panel()).getByText(m.catalogue_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("region", {
        name: m.catalogue_dropped_said(),
      }),
    ).toBeNull();
  });

  it("says for each reading why it could not be read", () => {
    reading({
      catalogue: { ok: false, problem: { kind: "refused", message: "No." } },
      provenance: {
        ok: false,
        problem: { kind: "refused", message: "Not now." },
      },
    });
    expect(within(panel()).getByText("No.")).toBeVisible();
    expect(within(panel()).getByText("Not now.")).toBeVisible();
  });
});
