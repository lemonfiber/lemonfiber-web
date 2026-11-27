import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { plugger } from "./pluggings";
import {
  listed,
  proveOffer,
  readProve,
  readRun,
  refresh,
  refreshables,
  runOffer,
  staleIndex,
  switchedOff,
  unread,
  wouldInstallAsking,
} from "../api/proofs";
import { installOffer, readInstall, released, wouldUpdate } from "../api/plugs";
import type { Reading } from "@lemonfiber/sdk-ts";
import type { PluginCatalogue } from "../lib/catalogued";
import type { Freshness } from "../lib/freshness";
import type { Plug, Plugger } from "../lib/plugging";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, the fetcher refreshable, acting handed this. */
function drawn(
  given: Plugger | undefined,
  offering?: Reading<PluginCatalogue>,
): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    plugins: { ok: true, value: refreshables },
    offering,
    plugger: given,
  });
}

/** A record of reading one act, answered with this report. */
const reading = (
  doing: Work["doing"],
  given: Work["given"],
  report: typeof readProve,
): Work => ({
  id: "70",
  doing,
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came: { kind: "plugins", report },
});

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.plug_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("proving a plugin again, on the settings screen", () => {
  it("reads proving each installed plugin again by its id", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    drawn({ ...plugger, onask });
    await press(m.action_plug_prove({ name: "Subtitle fetch" }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-prove",
      plugin: "subtitle-fetch",
    });
  });

  it("draws what it would ask and what is kept against it, then proves on a yes naming it", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    const work = [
      reading("plugin-prove", { plugin: "subtitle-fetch" }, readProve),
    ];
    drawn({ ...plugger, work, onask });
    expect(
      within(asked()).getByRole("heading", {
        name: m.plug_section_proving(),
      }),
    ).toBeVisible();
    expect(
      within(asked()).getByText(
        m.plug_kept({
          capability: "subtitles",
          operation: "search",
          why: "It answered with no language.",
        }),
      ),
    ).toBeVisible();
    await press(m.action_plug_prove_yes({ offer: proveOffer }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-prove",
      plugin: "subtitle-fetch",
      offer: proveOffer,
    });
  });
});

describe("running a recipe by name, on the settings screen", () => {
  it("offers each recipe run by name under its plugin, and none where it has none", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    drawn({ ...plugger, onask });
    expect(
      screen.getAllByRole("heading", { name: m.plug_run_title() }),
    ).toHaveLength(1);
    expect(screen.getByText(refresh.why)).toBeVisible();
    await press(m.action_plug_run({ recipe: refresh.title }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-run",
      plugin: "subtitle-fetch",
      recipe: "refresh",
    });
  });

  it("asks each input by its question, a secret one hidden, and holds the yes until each is typed", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    const given = { plugin: "subtitle-fetch", recipe: "refresh" };
    drawn({ ...plugger, work: [reading("plugin-run", given, readRun)], onask });
    const yes = within(asked()).getByRole("button", {
      name: m.action_plug_run_yes({ offer: runOffer }),
    });
    expect(yes).toHaveAttribute("aria-disabled", "true");
    const hidden = within(asked()).getByLabelText("What does it sign in with?");
    expect(hidden).toHaveAttribute("type", "password");
    await userEvent.type(
      within(asked()).getByRole("textbox", { name: "Which account signs in?" }),
      "household",
    );
    expect(yes).toHaveAttribute("aria-disabled", "true");
    await userEvent.type(hidden, "letters");
    await press(m.plug_approve({ approval: released.approval ?? "" }));
    await userEvent.click(yes);
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-run",
      plugin: "subtitle-fetch",
      recipe: "refresh",
      offer: runOffer,
      approved: [released.approval],
      inputs: ["account=household", "passphrase=letters"],
    });
    expect(hidden).toHaveValue("");
  });

  it("asks an install only what its install recipes ask, and sends it with the yes", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    const report = { ...readInstall, install: wouldInstallAsking };
    const work = [
      reading("plugin-install", { source: "subtitle-fetch" }, report),
    ];
    drawn({ ...plugger, work, onask });
    expect(
      within(asked()).queryByLabelText("What does it sign in with?"),
    ).toBeNull();
    await userEvent.type(
      within(asked()).getByRole("textbox", { name: "Which account signs in?" }),
      "household",
    );
    await press(m.action_plug_install_yes({ offer: installOffer }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-install",
      source: "subtitle-fetch",
      offer: installOffer,
      approved: [],
      inputs: ["account=household"],
    });
  });
});

describe("updating a plugin whose recipes ask, on the settings screen", () => {
  it("asks what the new version's install recipes ask before the yes", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    const report = {
      ...readInstall,
      agreement: "plugin-update:5d20",
      install: null,
      update: { ...wouldUpdate, install: wouldInstallAsking },
    };
    const given = { plugin: "subtitle-fetch", source: "example.org/sf.git" };
    drawn({
      ...plugger,
      work: [reading("plugin-update", given, report)],
      onask,
    });
    await userEvent.type(
      within(asked()).getByRole("textbox", { name: "Which account signs in?" }),
      "household",
    );
    await press(m.action_plug_update_yes({ offer: "plugin-update:5d20" }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-update",
      plugin: "subtitle-fetch",
      source: "example.org/sf.git",
      offer: "plugin-update:5d20",
      approved: [],
      inputs: ["account=household"],
    });
  });
});

describe("the plugin catalogue, on the settings screen", () => {
  it("lists each plugin it offers, and installs one through the install reading", async () => {
    const onask = vi.fn<(plug: Plug) => void>();
    drawn({ ...plugger, onask }, { ok: true, value: listed });
    const offered = screen.getByRole("list", {
      name: m.plug_catalogue_said(),
    });
    expect(within(offered).getByText(m.plug_catalogue_absent())).toBeVisible();
    await press(m.action_plug_catalogue_install({ name: "Cover art" }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-install",
      source: "cover-art",
    });
  });

  it("offers nothing to press where this page may not act", () => {
    drawn(undefined, { ok: true, value: listed });
    expect(
      screen.queryByRole("button", {
        name: m.action_plug_catalogue_install({ name: "Cover art" }),
      }),
    ).toBeNull();
  });

  it("names the setting that switches asking it on, where it is switched off", () => {
    drawn(plugger, { ok: true, value: switchedOff });
    expect(
      screen.getByText(
        m.plug_catalogue_off_setting({
          key: "LEMONFIBER_REACH_CATALOGUE",
          value: "on",
        }),
      ),
    ).toBeVisible();
  });

  it("says lemonfiber's sentence and lists nothing where its index could not be read", () => {
    drawn(plugger, { ok: true, value: unread });
    expect(screen.getByText(staleIndex.summary)).toBeVisible();
    expect(
      screen.queryByRole("list", { name: m.plug_catalogue_said() }),
    ).toBeNull();
  });

  it("says why it could not be read where the read was turned down", () => {
    drawn(plugger, {
      ok: false,
      problem: { kind: "unreachable", message: "Nothing answered." },
    });
    expect(screen.getByText("Nothing answered.")).toBeVisible();
  });
});
