import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Storage from "./Storage.svelte";
import {
  archive,
  keeper,
  kept,
  listed,
  listing,
  readListing,
  tookBackup,
} from "./keeping";
import type { Freshness } from "../lib/freshness";
import type { Archives } from "../lib/kept";
import type { Keeper } from "../lib/upkeep";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 6 };

/** The disk screen, with the backups under what the checks found. */
function keeping(
  over: Partial<Keeper> = {},
  archives: Reading<Archives> = { ok: true, value: kept },
): void {
  render(Storage, {
    disk: undefined,
    live: { kind: "never" },
    diagnosis: undefined,
    read: answered,
    keeping: { keeper: { ...keeper, ...over }, archives },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_backups() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.backups_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("the backups kept on this machine", () => {
  it("draws nothing where nothing answers it", () => {
    render(Storage, {
      disk: undefined,
      live: { kind: "never" },
      diagnosis: undefined,
      read: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_backups() }),
    ).toBeNull();
  });

  it("lists every backup by the name it was written under", () => {
    keeping();
    const list = within(panel()).getByRole("list", { name: m.backups_kept() });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText(archive)).toBeInTheDocument();
  });

  it("says so where none are kept", () => {
    keeping({}, { ok: true, value: { archives: [] } });
    expect(within(panel()).getByText(m.backups_none())).toBeInTheDocument();
  });

  it("says why they could not be read, in lemonfiber's words", () => {
    keeping(
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
    render(Storage, {
      disk: undefined,
      live: { kind: "never" },
      diagnosis: undefined,
      read: answered,
      keeping: { keeper, archives: undefined },
    });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });
});

describe("taking a backup", () => {
  // A story draws the panel from a keeper whose controls answer nothing, and
  // pressing one there must leave the screen as it was.
  it("stands still where nothing answers what is pressed", async () => {
    keeping();

    await press(m.action_backup());

    expect(within(panel()).getByText(archive)).toBeInTheDocument();
  });

  it("asks for one when it is pressed", async () => {
    const onask = vi.fn();
    keeping({ onask });

    await press(m.action_backup());

    expect(onask).toHaveBeenCalledWith({ doing: "backup" });
  });

  // Nothing comes back to read before a backup is written, so what it writes
  // and what it needs is said before the yes.
  it("says what it writes before the yes, and silences the rest meanwhile", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    keeping({ asked: { doing: "backup" }, onask, onleave });

    expect(
      within(asked()).getByText(m.confirm_backup_prose()),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: m.action_backup() }),
    ).toHaveAttribute("aria-disabled", "true");

    await press(m.action_backup_yes());
    expect(onask).toHaveBeenCalledWith({ doing: "backup" });
    await press(m.action_leave_as_is());
    expect(onleave).toHaveBeenCalled();
    expect(asked()).toHaveFocus();
  });

  it("lists what a backup came to under its record", () => {
    keeping({ work: [tookBackup] });
    const lines = within(asked()).getByRole("list", { name: m.came_heading() });
    expect(within(lines).getByText(m.came_sensitive())).toBeInTheDocument();
  });

  it("puts a record away when asked, naming it", async () => {
    const ondrop = vi.fn();
    keeping({ work: [tookBackup], ondrop });

    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(tookBackup.id);
  });
});

describe("putting a backup back", () => {
  it("asks what putting one back would do, naming it, before anything else", async () => {
    const onask = vi.fn();
    keeping({ onask });

    await press(m.action_restore_listing({ archive }));

    expect(onask).toHaveBeenCalledWith({ doing: "restore", archive });
  });

  it("shows the listing, and the yes names the listing it was read in", async () => {
    const onask = vi.fn();
    keeping({ work: [readListing], onask });

    expect(
      within(asked()).getByRole("heading", {
        name: m.backups_listing_title({ archive }),
      }),
    ).toBeInTheDocument();
    expect(
      within(asked()).getByText(
        m.came_restore_relocation({ now: "/mnt/media", was: "/srv/media" }),
      ),
    ).toBeInTheDocument();

    await press(m.action_restore_yes({ archive }));

    expect(onask).toHaveBeenCalledWith({
      doing: "restore",
      archive,
      offer: listed,
      repoint: false,
    });
  });

  // The one choice a listing leaves open is whether the archive is pointed at
  // this machine's data location, and the yes carries it.
  it("carries pointing the archive at this machine's data, where chosen", async () => {
    const onask = vi.fn();
    keeping({ work: [readListing], onask });
    const repoint = screen.getByRole("button", {
      name: m.backups_repoint_label(),
    });

    await userEvent.click(repoint);
    expect(repoint).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(repoint);
    await userEvent.click(repoint);
    await press(m.action_restore_yes({ archive }));

    expect(onask).toHaveBeenLastCalledWith({
      doing: "restore",
      archive,
      offer: listed,
      repoint: true,
    });
  });

  it("asks nothing about pointing where the archive's location matches", () => {
    const matched: Work = {
      id: "30",
      doing: "restore",
      scoped: false,
      given: { archive },
      at: "done",
      job: undefined,
      came: {
        kind: "restore",
        report: { ...listing, would: { ...listing.would, relocation: null } },
      },
    };
    keeping({ work: [matched] });
    expect(
      screen.queryByRole("button", { name: m.backups_repoint_label() }),
    ).toBeNull();
  });

  it("puts the listing away when it is left as it is", async () => {
    const ondrop = vi.fn();
    keeping({ work: [readListing], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(readListing.id);
    expect(asked()).toHaveFocus();
  });
});
