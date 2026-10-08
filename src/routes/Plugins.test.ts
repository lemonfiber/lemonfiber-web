import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { plugins, subtitles } from "../api/installs";
import type { Freshness } from "../lib/freshness";
import {
  installedLines,
  nameOf,
  substitutedLine,
  type Plugins,
} from "../lib/plugins";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the plugins read. */
function reading(held: Reading<Plugins> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, plugins: held });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_plugins() });

describe("the plugins, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names each plugin with what it does and where it came from", () => {
    reading({ ok: true, value: plugins });
    const listed = within(panel()).getByRole("list", {
      name: m.plugin_said(),
    });
    expect(
      within(listed)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toStrictEqual(plugins.installed.map((one) => nameOf(one)));
    for (const line of installedLines(subtitles, plugins.sources ?? [])) {
      expect(within(listed).getByText(line)).toBeVisible();
    }
  });

  it("names every capability a plugin fills in place of the stack's own", () => {
    reading({ ok: true, value: plugins });
    const filling = within(panel()).getByRole("region", {
      name: m.plugin_substituted_said(),
    });
    for (const one of plugins.substituted ?? []) {
      expect(within(filling).getByText(substitutedLine(one))).toBeVisible();
    }
  });

  it("says nothing of a source where the reading asked none", () => {
    reading({ ok: true, value: { installed: [subtitles], rehearsed: false } });
    expect(
      within(panel()).queryByText(
        m.plugin_source_reachable({ from: subtitles.from ?? "" }),
      ),
    ).toBeNull();
    expect(
      within(panel()).getByText(m.plugin_version({ version: "1.4.0" })),
    ).toBeVisible();
  });

  it("says so where no plugin is installed", () => {
    reading({ ok: true, value: { installed: [], rehearsed: false } });
    expect(within(panel()).getByText(m.plugin_none())).toBeVisible();
    expect(within(panel()).queryByRole("list")).toBeNull();
    expect(
      within(panel()).queryByRole("region", {
        name: m.plugin_substituted_said(),
      }),
    ).toBeNull();
  });

  it("says why they could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
