import { render, screen } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Storage from "./Storage.svelte";
import { diskChecks, moment, unavailable } from "./fixture";
import { bytes } from "../lib/figures";
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
  } = {},
): void {
  render(Storage, {
    disk: "disk" in over ? over.disk : moment.storage,
    live: over.live ?? answered,
    diagnosis:
      "diagnosis" in over ? over.diagnosis : { ok: true, value: diskChecks },
    read: over.read ?? answered,
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
      diagnosis: { ok: true, value: { overall: "unknown", findings: [] } },
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
