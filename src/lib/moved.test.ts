import { describe, expect, it } from "vitest";
import {
  adoptedLines,
  besideLines,
  importedLines,
  replacedLines,
  stanceLine,
  type Stance,
} from "./moved";
import { carryingLines } from "./survey";
import {
  adoptRefused,
  adopted,
  besideWritten,
  imported,
  replacedPartly,
  wouldAdopt,
  wouldImport,
  wouldReplace,
  wouldStandBeside,
} from "../api/moves";
import { olderSonarr } from "../api/surveys";
import * as m from "../paraglide/messages.js";

describe("where an act stands", () => {
  it("has a sentence for each stance, and lemonfiber's own where it refused", () => {
    expect(stanceLine("pending", undefined)).toBe(m.move_pending());
    expect(stanceLine("applied", null)).toBe(m.move_applied());
    expect(stanceLine("unchanged", undefined)).toBe(m.move_unchanged());
    expect(stanceLine("blocked", "No.")).toBe("No.");
    expect(stanceLine("blocked", "")).toBe(m.move_blocked());
    expect(stanceLine("blocked", null)).toBe(m.move_blocked());
    expect(stanceLine("moved" as Stance, undefined)).toBe(
      m.move_stance_other(),
    );
  });
});

describe("adopting", () => {
  it("names the project, what to back up first and every upgrade", () => {
    expect(adoptedLines(wouldAdopt)).toStrictEqual([
      m.move_pending(),
      m.move_adopt_project({ project: "media" }),
      m.move_back_up({ paths: "/srv/sonarr, /srv/radarr" }),
      ...carryingLines(olderSonarr),
    ]);
  });

  it("names where the backup went once done, and says why where refused", () => {
    expect(adoptedLines(adopted)).toContain(
      m.move_backed_up({ path: "/srv/lemonfiber/adopt-media.tar" }),
    );
    expect(adoptedLines(adoptRefused)).toStrictEqual([adoptRefused.refusal]);
  });
});

describe("standing beside", () => {
  it("names each port moved, and where the file was written", () => {
    expect(besideLines(wouldStandBeside)).toStrictEqual([
      m.move_pending(),
      m.survey_beside({ service: "sonarr", from: 8989, to: 18989 }),
    ]);
    expect(besideLines(besideWritten)).toContain(
      m.move_written({ path: "/srv/lemonfiber/compose.beside.yml" }),
    );
  });
});

describe("importing", () => {
  it("names what it would carry, and what it cannot with why", () => {
    expect(importedLines(wouldImport)).toStrictEqual([
      m.move_pending(),
      m.move_import_project({ project: "media" }),
      m.move_would_carry(),
      m.move_record({ kind: "series", name: "Bluey", service: "sonarr" }),
      m.survey_named({
        what: "media/cron-helper",
        because: "It keeps no records.",
      }),
    ]);
  });

  it("names what it carried once done", () => {
    expect(importedLines(imported)).toContain(m.move_carried());
    expect(
      importedLines({ ...imported, project: null, not_carried: [] }),
    ).toStrictEqual([
      m.move_applied(),
      m.move_carried(),
      m.move_record({ kind: "series", name: "Bluey", service: "sonarr" }),
    ]);
  });
});

describe("replacing", () => {
  it("names every service it would stop before it does", () => {
    expect(replacedLines(wouldReplace)).toStrictEqual([
      m.move_pending(),
      m.move_replace_project({ project: "media" }),
      m.move_would_stop({ services: "sonarr, radarr" }),
    ]);
  });

  it("is never said to be done while anything it replaces still runs", () => {
    expect(replacedLines(replacedPartly)).toStrictEqual([
      m.move_not_done({ services: "radarr" }),
      m.move_replace_project({ project: "media" }),
      m.move_stopped({ services: "sonarr" }),
    ]);
    expect(replacedLines({ ...replacedPartly, still_running: [] })[0]).toBe(
      m.move_applied(),
    );
  });

  it("names what still runs where it was not done", () => {
    expect(
      replacedLines({
        ...wouldReplace,
        stance: "blocked",
        refusal: "Radarr started since the offer.",
        still_running: ["radarr"],
        project: null,
        would_stop: [],
      }),
    ).toStrictEqual([
      "Radarr started since the offer.",
      m.move_still_running({ services: "radarr" }),
    ]);
  });
});
