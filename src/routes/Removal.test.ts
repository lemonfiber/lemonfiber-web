import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Storage from "./Storage.svelte";
import {
  remover,
  removedRecord,
  settledSurvey,
  storedRecord,
  surveyed,
  surveyRecord,
} from "./removals";
import { bytes } from "../lib/figures";
import type { Freshness } from "../lib/freshness";
import { labelOfTier, storedLines, uninstallLines } from "../lib/removed";
import type { Remover } from "../lib/removing";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 8 };

/** The disk screen, with taking lemonfiber off it at the end. */
function removing(over: Partial<Remover> = {}): void {
  render(Storage, {
    disk: undefined,
    live: { kind: "never" },
    diagnosis: undefined,
    read: answered,
    remover: { ...remover, ...over },
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.removal_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

/** The removal the fixture lists, with nothing coming down. */
const quietRecord: Work = {
  id: "86",
  doing: "uninstall",
  scoped: false,
  given: { tier: "stop" },
  at: "done",
  job: undefined,
  came: { kind: "uninstall", report: settledSurvey },
};

/** The media removal, listed and not yet agreed to. */
const mediaRecord: Work = {
  ...quietRecord,
  id: "88",
  given: { tier: "media" },
  came: {
    kind: "uninstall",
    report: { ...surveyed, manifest: { ...surveyed.manifest, tier: "media" } },
  },
};

describe("taking lemonfiber off, from the disk screen", () => {
  it("is not drawn where nothing answers it", () => {
    render(Storage, {
      disk: undefined,
      live: { kind: "never" },
      diagnosis: undefined,
      read: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_removal() }),
    ).toBeNull();
  });

  it("lists what lemonfiber keeps first, and removes nothing", async () => {
    const onask = vi.fn();
    removing({ onask });

    await press(m.action_forget_list());

    expect(onask).toHaveBeenCalledWith({ doing: "forget" });
    expect(asked()).toHaveFocus();
  });

  it("lists what the removal chosen reaches first, and removes nothing", async () => {
    const onask = vi.fn();
    removing({ onask });

    await userEvent.click(
      screen.getByRole("radio", { name: labelOfTier("media") }),
    );
    await press(m.action_remove_list());

    expect(onask).toHaveBeenCalledWith({ doing: "uninstall", tier: "media" });
  });
});

describe("forgetting, under the listing", () => {
  it("shows everything kept before the yes, and forgets on it", async () => {
    const onask = vi.fn();
    removing({ work: [storedRecord], onask });

    const shown = within(asked());
    expect(
      shown.getByRole("region", { name: m.forget_plan_title() }),
    ).toBeVisible();
    if (storedRecord.at === "done" && storedRecord.came.kind === "stored") {
      for (const line of storedLines(storedRecord.came.report)) {
        expect(shown.getByText(line)).toBeVisible();
      }
    }

    await press(m.action_forget_yes());
    expect(onask).toHaveBeenCalledWith({ doing: "forget", confirm: true });
  });

  it("puts the listing away when it is left as it is", async () => {
    const ondrop = vi.fn();
    removing({ work: [storedRecord], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(storedRecord.id);
  });
});

describe("a removal, under its listing", () => {
  it("shows every line it reaches before the yes", () => {
    removing({ work: [surveyRecord] });
    const shown = within(asked());
    expect(
      shown.getByRole("region", {
        name: m.remove_plan_title({ tier: labelOfTier("services") }),
      }),
    ).toBeVisible();
    if (surveyRecord.at === "done" && surveyRecord.came.kind === "uninstall") {
      for (const line of uninstallLines(surveyRecord.came.report)) {
        expect(shown.getAllByText(line)[0]).toBeVisible();
      }
    }
  });

  // The yes names the listing it was read in, so lemonfiber removes what was
  // read or refuses; and it carries whether what is coming down finishes first.
  it("removes on a yes naming the listing, letting downloads finish where asked", async () => {
    const onask = vi.fn();
    removing({ work: [surveyRecord], onask });

    await press(m.remove_wait());
    await press(m.action_remove_yes());

    expect(onask).toHaveBeenCalledWith({
      doing: "uninstall",
      tier: "services",
      offer: "services-4f1a",
      wait: true,
    });
  });

  it("asks about downloads only where something is coming down", () => {
    removing({ work: [quietRecord] });
    expect(screen.queryByRole("button", { name: m.remove_wait() })).toBeNull();
    expect(
      screen.queryByText(
        m.remove_media_prose({ size: bytes(settledSurvey.manifest.bytes) }),
      ),
    ).toBeNull();
  });

  // Deleting media is a removal of its own, and its listing says the volume
  // everything it takes comes to before the yes.
  it("says what taking the media comes to before that yes", () => {
    removing({ work: [mediaRecord] });
    expect(
      screen.getByText(
        m.remove_media_prose({ size: bytes(surveyed.manifest.bytes) }),
      ),
    ).toBeVisible();
  });

  it("puts the listing away when it is left as it is", async () => {
    const ondrop = vi.fn();
    removing({ work: [quietRecord], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(quietRecord.id);
  });

  it("keeps a record of what the removal came to, and no listing once taken", async () => {
    const ondrop = vi.fn();
    removing({ work: [removedRecord], ondrop });

    expect(
      screen.queryByRole("button", { name: m.action_remove_yes() }),
    ).toBeNull();
    expect(
      within(asked()).getByText(
        m.remove_credential({ what: "The service keys" }),
      ),
    ).toBeVisible();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(removedRecord.id);
  });
});

describe("the removal panel's controls", () => {
  it("are silenced while a request is in flight", () => {
    removing({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_forget_list() }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("button", { name: m.action_remove_list() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("press to nothing where nothing answers them", async () => {
    removing({
      work: [{ ...removedRecord, id: "87", at: "under-way", job: "9e21" }],
    });
    await press(m.action_hide_record());
    await press(m.action_forget_list());
    expect(within(asked()).getByText(m.doing_uninstall_title())).toBeVisible();
  });
});
