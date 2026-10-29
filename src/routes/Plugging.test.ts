import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import {
  installMade,
  installOffer,
  installRead,
  installReadGranting,
  installReadGuarded,
  installReadWaiting,
  plugger,
  removeRead,
  updateRead,
} from "./pluggings";
import { plugins, subtitles } from "../api/installs";
import type { Freshness } from "../lib/freshness";
import type { Plugger } from "../lib/plugging";
import type { Installed } from "../lib/plugins";
import { grantingLine, takingLines, writesLines } from "../lib/plugged";
import { crossing, guarding, readInstall, wouldInstall } from "../api/plugs";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the plugins read and acting on them handed this. */
function drawn(given: Plugger | undefined): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    plugins: { ok: true, value: plugins },
    plugger: given,
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.plug_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("acting on a plugin, on the settings screen", () => {
  it("offers nothing to press where this page may not act", () => {
    drawn(undefined);
    expect(
      screen.queryByRole("button", { name: m.action_plug_read() }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: m.action_plug_remove({ name: "Subtitle fetch" }),
      }),
    ).toBeNull();
  });

  it("reads an install from the source typed, trimmed, and not before one is", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, onask });
    expect(
      screen.getByRole("button", { name: m.action_plug_read() }),
    ).toHaveAttribute("aria-disabled", "true");

    await userEvent.type(screen.getByLabelText(m.plug_source()), " komga ");
    await press(m.action_plug_read());

    expect(onask).toHaveBeenCalledWith({
      doing: "plugin-install",
      source: "komga",
    });
    expect(asked()).toHaveFocus();
  });

  it("reads an update of each installed plugin from the source its record keeps, and a removal by its id", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, onask });

    await press(m.action_plug_update({ name: "Subtitle fetch" }));
    await press(m.action_plug_remove({ name: "hand-rolled" }));

    expect(onask).toHaveBeenNthCalledWith(1, {
      doing: "plugin-update",
      plugin: "subtitle-fetch",
      source: "example.org/subtitle-fetch.git",
    });
    expect(onask).toHaveBeenNthCalledWith(2, {
      doing: "plugin-remove",
      plugin: "hand-rolled",
    });
  });

  it("reads an update of a plugin whose record keeps no source with none, for lemonfiber to answer", async () => {
    const onask = vi.fn();
    const sourceless: Installed = {
      plugin: subtitles.plugin,
      name: "Subtitle fetch",
      version: subtitles.version,
      services: [],
    };
    render(Settings, {
      quality: undefined,
      freshness: answered,
      plugins: { ok: true, value: { ...plugins, installed: [sourceless] } },
      plugger: { ...plugger, onask },
    });

    await press(m.action_plug_update({ name: "Subtitle fetch" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "plugin-update",
      plugin: "subtitle-fetch",
      source: "",
    });
  });

  it("draws the whole reading before its yes, and the yes names it", () => {
    drawn({ ...plugger, work: [installRead] });

    const offer = within(asked()).getByRole("region", {
      name: m.plug_offer_title(),
    });
    for (const title of [
      m.plug_section_plugin(),
      m.plug_section_writes(),
      m.plug_section_reaches(),
      m.plug_section_verified(),
      m.plug_section_recipes(),
    ]) {
      expect(within(offer).getByRole("heading", { name: title })).toBeVisible();
    }
    for (const line of writesLines(wouldInstall)) {
      expect(within(offer).getByText(line)).toBeVisible();
    }
    expect(
      within(offer).getByRole("button", {
        name: m.action_plug_install_yes({ offer: installOffer }),
      }),
    ).toBeVisible();
  });

  it("names each service the install would leave held back, with what it waits for and never a value", () => {
    drawn({ ...plugger, work: [installReadWaiting] });

    const offer = within(asked()).getByRole("region", {
      name: m.plug_offer_title(),
    });
    expect(
      within(offer).getByRole("heading", { name: m.waits_title() }),
    ).toBeVisible();
    for (const line of [
      m.waits_heading(),
      "subtitle-fetch waits for the setting subtitle-fetch:language, one of en, nl; the secret subtitle-fetch:account-key",
      "Give a setting under Service settings, on the Settings screen.",
    ]) {
      expect(within(offer).getByText(line)).toBeVisible();
    }
  });

  it("names the operator's own overlay in its own section of the reading", () => {
    drawn({
      ...plugger,
      work: [
        {
          id: installRead.id,
          doing: "plugin-install",
          scoped: false,
          given: installRead.given,
          at: "done",
          job: undefined,
          came: {
            kind: "plugins",
            report: {
              ...readInstall,
              unvetted: {
                overlay: "/etc/lemonfiber/overlay.yml",
                services: ["subtitle-fetch"],
              },
            },
          },
        },
      ],
    });

    const offer = within(asked()).getByRole("region", {
      name: m.plug_offer_title(),
    });
    expect(
      within(offer).getByRole("heading", { name: m.overlay_title() }),
    ).toBeVisible();
    expect(
      within(offer).getByText(
        "Your own overlay at /etc/lemonfiber/overlay.yml changes subtitle-fetch. Nothing in it is held to what lemonfiber checks, so it is unvetted.",
      ),
    ).toBeVisible();
  });

  it("names nothing held back where the install would leave nothing waiting", () => {
    drawn({ ...plugger, work: [installRead] });

    expect(
      within(asked()).queryByRole("heading", { name: m.waits_title() }),
    ).toBeNull();
  });

  it("sends the yes under the reading's name with each value approved, and only those", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, work: [installRead], onask });
    const yes = m.action_plug_install_yes({ offer: installOffer });
    const approve = m.plug_approve({ approval: "api_key@opensubtitles" });

    await press(yes);
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-install",
      source: "subtitle-fetch",
      offer: installOffer,
      approved: [],
    });

    await userEvent.click(screen.getByRole("button", { name: approve }));
    expect(
      screen.getByText(m.plug_approved_count({ approved: 1, asked: 1 })),
    ).toBeVisible();
    await press(yes);
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-install",
      source: "subtitle-fetch",
      offer: installOffer,
      approved: ["api_key@opensubtitles"],
    });

    await userEvent.click(screen.getByRole("button", { name: approve }));
    await press(yes);
    expect(onask).toHaveBeenLastCalledWith(
      expect.objectContaining({ approved: [] }),
    );
  });

  it("draws each privileged shape a service would take, approved on its own switch", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, work: [installReadGuarded], onask });
    const offer = within(asked()).getByRole("region", {
      name: m.plug_offer_title(),
    });
    expect(
      within(offer).getByRole("heading", { name: m.plug_section_taking() }),
    ).toBeVisible();
    for (const line of takingLines(guarding)) {
      expect(within(offer).getByText(line)).toBeVisible();
    }

    await userEvent.click(
      screen.getByRole("button", {
        name: m.plug_approve({ approval: "egress-guard@tunnel" }),
      }),
    );
    expect(
      screen.getByText(m.plug_approved_count({ approved: 1, asked: 2 })),
    ).toBeVisible();
    await press(m.action_plug_install_yes({ offer: installOffer }));
    expect(onask).toHaveBeenLastCalledWith(
      expect.objectContaining({ approved: ["egress-guard@tunnel"] }),
    );
  });

  it("says where no service takes a privileged shape, and no credential crosses", () => {
    drawn({ ...plugger, work: [installRead] });
    expect(screen.getByText(m.plug_taking_none())).toBeVisible();
    expect(screen.getByText(m.plug_granting_none())).toBeVisible();
  });

  it("draws each credential that would cross, off until approved on its own switch, and agreeing to the reading approves none", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, work: [installReadGranting], onask });
    const offer = within(asked()).getByRole("region", {
      name: m.plug_offer_title(),
    });
    expect(
      within(offer).getByRole("heading", { name: m.plug_section_granting() }),
    ).toBeVisible();
    expect(within(offer).getByText(grantingLine(crossing))).toBeVisible();
    const approval = m.plug_approve({
      approval: "sonarr.api_key@subtitle-fetch",
    });
    expect(screen.getByRole("button", { name: approval })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await press(m.action_plug_install_yes({ offer: installOffer }));
    expect(onask).toHaveBeenLastCalledWith(
      expect.objectContaining({ approved: [] }),
    );

    await userEvent.click(screen.getByRole("button", { name: approval }));
    await press(m.action_plug_install_yes({ offer: installOffer }));
    expect(onask).toHaveBeenLastCalledWith(
      expect.objectContaining({ approved: ["sonarr.api_key@subtitle-fetch"] }),
    );
  });

  it("draws an update's account and a removal's, each with a yes naming its reading", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, work: [updateRead], onask });
    expect(
      screen.getByRole("heading", { name: m.plug_section_update() }),
    ).toBeVisible();
    await press(m.action_plug_update_yes({ offer: "plugin-update:5d20" }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-update",
      plugin: "subtitle-fetch",
      source: "example.org/subtitle-fetch.git",
      offer: "plugin-update:5d20",
      approved: [],
    });
  });

  it("draws a removal with no recipes to approve, and sends its yes alone", async () => {
    const onask = vi.fn();
    drawn({ ...plugger, work: [removeRead], onask });
    expect(
      screen.getByRole("heading", { name: m.plug_section_removal() }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: m.plug_section_recipes() }),
    ).toBeNull();
    await press(m.action_plug_remove_yes({ offer: "plugin-remove:7e01" }));
    expect(onask).toHaveBeenLastCalledWith({
      doing: "plugin-remove",
      plugin: "subtitle-fetch",
      offer: "plugin-remove:7e01",
    });
  });

  it("puts a reading away on leaving it, and a record on hiding it", async () => {
    const ondrop = vi.fn();
    drawn({ ...plugger, work: [installRead], ondrop });
    await press(m.action_leave_as_is());
    expect(ondrop).toHaveBeenLastCalledWith("61");
    await press(m.action_hide_record());
    expect(ondrop).toHaveBeenLastCalledWith("61");
    expect(asked()).toHaveFocus();
  });

  it("asks nothing of a page where nothing answers", async () => {
    drawn({ ...plugger, work: [installRead] });
    await press(m.action_plug_install_yes({ offer: installOffer }));
    expect(asked()).toHaveFocus();
  });

  it("stands no yes once the act ran, and says what it came to", () => {
    drawn({ ...plugger, work: [installMade] });
    expect(
      screen.queryByRole("region", { name: m.plug_offer_title() }),
    ).toBeNull();
    expect(
      screen.getByText(
        m.plug_installed({ plugin: "subtitle-fetch", version: "1.4.0" }),
      ),
    ).toBeVisible();
  });

  it("says a reading with no recipe has none", () => {
    drawn({
      ...plugger,
      work: [
        {
          id: "61",
          doing: "plugin-install",
          scoped: false,
          given: { source: "subtitle-fetch" },
          at: "done",
          job: undefined,
          came: {
            kind: "plugins",
            report: {
              ...readInstall,
              install: { ...wouldInstall, would: subtitles },
            },
          },
        },
      ],
    });
    expect(screen.getByText(m.plug_recipes_none())).toBeVisible();
  });

  it("says an act under way is, with nothing it came to yet", () => {
    drawn({
      ...plugger,
      work: [
        {
          id: "65",
          doing: "plugin-install",
          scoped: false,
          given: { source: "komga" },
          at: "under-way",
          job: "5c63",
        },
      ],
    });
    expect(
      within(asked()).getByText(m.doing_plug_install_title()),
    ).toBeVisible();
    expect(within(asked()).queryByText(m.came_heading())).toBeNull();
  });
});
