import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Storage from "./Storage.svelte";
import { moment, unavailable } from "./fixture";
import { diskChecks } from "./findings";
import { backingUp, pacedBackup, stalledRestore } from "../api/copyings";
import type { Running } from "../lib/copying";
import { bytes, rate } from "../lib/figures";
import { whenOf } from "../lib/instant";
import type { Freshness } from "../lib/freshness";
import type { Diagnosis, Disk } from "../lib/wire";
import * as m from "../paraglide/messages.js";

const never: Freshness = { kind: "never" };
const answered: Freshness = { kind: "answered", secondsAgo: 4 };

/** The screen with nothing yet, and whatever this test hands it instead. */
function disk(
  over: {
    disk?: Disk | undefined;
    live?: Freshness;
    diagnosis?: Reading<Diagnosis> | undefined;
    read?: Freshness;
    copying?: { running: Running; freshness: Freshness } | undefined;
  } = {},
): void {
  render(Storage, {
    disk: "disk" in over ? over.disk : moment.storage,
    live: over.live ?? answered,
    diagnosis:
      "diagnosis" in over ? over.diagnosis : { ok: true, value: diskChecks },
    read: over.read ?? answered,
    copying: over.copying,
  });
}

describe("the disk itself", () => {
  it("says what is left of it", () => {
    disk();
    expect(
      screen.getByRole("region", { name: m.panel_space() }),
    ).toHaveTextContent(bytes(412_000_000_000));
  });

  // A volume that could not be read this refresh says so inside its own border,
  // and the checks beside it carry on.
  it("says why the volume could not be read, and keeps the checks", () => {
    disk({ disk: unavailable });
    expect(
      screen.getByText("The download client is not answering."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: m.panel_disk_findings() }),
    ).toBeInTheDocument();
  });
});

describe("the checks about the disk", () => {
  it("names them as checks about the disk rather than as every check", () => {
    disk();
    expect(
      screen.getByRole("region", { name: m.panel_disk_findings() }),
    ).toBeInTheDocument();
  });

  it("says what each of them found", () => {
    disk();
    expect(
      screen.getByRole("heading", {
        name: "Downloads and the library are on one filesystem",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Less than a tenth of the data volume is free."),
    ).toBeInTheDocument();
  });

  it("says plainly where no check about the disk has reported in", () => {
    disk({
      diagnosis: {
        ok: true,
        value: { rehearsed: false, overall: "unknown", findings: [] },
      },
    });
    expect(
      screen.getByRole("region", { name: m.panel_disk_findings() }),
    ).toHaveTextContent(m.storage_none());
  });

  // One source falling behind is visible in the panel it fed and nowhere else.
  it("keeps the figures while the checks are silent", () => {
    disk({
      diagnosis: {
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      },
      read: { kind: "silent", secondsAgo: 180 },
    });

    expect(screen.getByText("Nothing answered.")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: m.panel_space() }),
    ).toHaveTextContent(bytes(412_000_000_000));
  });
});

describe("before anything has answered", () => {
  it("holds a place on both panels", () => {
    disk({ disk: undefined, live: never, diagnosis: undefined, read: never });
    expect(screen.getAllByText(m.waiting_answer())).toHaveLength(2);
  });
});

describe("a backup or restore while it runs", () => {
  const copying = (running: Running): void => {
    disk({ copying: { running, freshness: answered } });
  };

  it("draws no panel for one where none runs", () => {
    disk();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: m.copying_backup() }),
    ).not.toBeInTheDocument();
  });

  it("says how much it has written of how much it will, as a bar and in words", () => {
    copying(backingUp);
    const panel = screen.getByRole("region", { name: m.copying_backup() });
    const figures = m.copying_written({
      written: bytes(backingUp.written),
      whole: bytes(backingUp.whole),
    });
    expect(panel).toHaveTextContent(figures);
    const bar = within(panel).getByRole("progressbar", {
      name: m.copying_backup(),
    });
    expect(bar).toHaveAttribute("aria-valuetext", figures);
    expect(bar).toHaveAttribute("aria-valuenow", "34");
    expect(panel).toHaveTextContent(
      m.copying_started({ when: whenOf(backingUp.started) }),
    );
  });

  it("announces its state and part alone, never the figures", () => {
    copying(backingUp);
    const told = within(
      screen.getByRole("region", { name: m.copying_backup() }),
    ).getByRole("status");
    expect(told).toHaveTextContent(m.copying_working());
    expect(told).toHaveTextContent(m.copying_part({ part: backingUp.part }));
    expect(told).not.toHaveTextContent(bytes(backingUp.written));
  });

  it("says a backup slowed on purpose, with the limit set", () => {
    copying(pacedBackup);
    expect(screen.getByRole("status")).toHaveTextContent(
      m.copying_paced({ limit: rate(52428800) }),
    );
  });

  it("says a restore that has stalled, with when it last wrote", () => {
    copying(stalledRestore);
    const panel = screen.getByRole("region", { name: m.copying_restore() });
    expect(within(panel).getByRole("status")).toHaveTextContent(
      m.copying_stalled({ wrote: whenOf(stalledRestore.wrote) }),
    );
  });
});
