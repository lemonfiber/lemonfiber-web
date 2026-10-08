import { describe, expect, it } from "vitest";
import {
  installedLine,
  standingLines,
  versionLines,
  type Standing,
} from "./copy";
import { behind, untold, versions } from "../api/copies";
import * as m from "../paraglide/messages.js";

describe("the versions in play", () => {
  it("names the program, the stack, the engine and the schemas it reads", () => {
    expect(versionLines(versions)).toStrictEqual([
      m.copy_binary({ version: "0.17.2" }),
      m.copy_stack({ version: "2026.10" }),
      m.copy_engine({ version: "2.39.1" }),
      m.copy_schemas({ schemas: "3, 4" }),
    ]);
  });

  it("says the engine could not be asked, rather than naming no version", () => {
    expect(versionLines({ ...versions, compose: null })).toContain(
      m.copy_engine_unasked(),
    );
  });
});

describe("where this copy stands", () => {
  it("names the newer release, how it was installed, and exactly what to type", () => {
    expect(standingLines(behind)).toStrictEqual([
      m.copy_available({ version: "0.17.2", offered: "0.18.0" }),
      m.copy_installed_by({ tool: "Homebrew" }),
      m.copy_at({ at: "/opt/homebrew/bin/lemonfiber" }),
      m.copy_command({ command: "brew upgrade lemonfiber" }),
      behind.changed,
      behind.carries,
      behind.afterwards,
    ]);
  });

  it("says why it could not tell, and what to do instead", () => {
    expect(standingLines(untold)).toStrictEqual([
      m.copy_untold({
        version: "0.17.2",
        why: "The release list did not answer.",
      }),
      m.copy_installed_untellable(),
      untold.instead,
      untold.carries,
      untold.afterwards,
    ]);
  });

  it("says each standing, with words of its own where lemonfiber gave none", () => {
    const first = (one: Standing): string | undefined => standingLines(one)[0];
    expect(first({ ...behind, standing: "current" })).toBe(
      m.copy_current({ version: "0.17.2" }),
    );
    expect(first({ ...behind, offered: null })).toBe(
      m.copy_available({
        version: "0.17.2",
        offered: m.copy_offered_unnamed(),
      }),
    );
    expect(first({ ...behind, standing: "managed-externally" })).toBe(
      m.copy_managed({ version: "0.17.2", owner: "Homebrew" }),
    );
    expect(
      first({ ...behind, standing: "managed-externally", owner: null }),
    ).toBe(
      m.copy_managed({ version: "0.17.2", owner: m.copy_owner_unnamed() }),
    );
    expect(first({ ...untold, untold: null })).toBe(
      m.copy_untold({ version: "0.17.2", why: m.copy_untold_unsaid() }),
    );
    expect(
      first({ ...behind, standing: "sideways" as Standing["standing"] }),
    ).toBe(m.copy_standing_other({ version: "0.17.2" }));
  });

  it("has a sentence for every way a copy gets onto a machine", () => {
    const ways: readonly [Standing["installed"], string][] = [
      ["scoop", m.copy_installed_by({ tool: "Scoop" })],
      ["winget", m.copy_installed_by({ tool: "winget" })],
      ["cargo", m.copy_installed_by({ tool: "cargo" })],
      ["distribution", m.copy_installed_distribution()],
      ["installer", m.copy_installed_installer()],
      ["image", m.copy_installed_image()],
      ["elsewhere", m.copy_installed_elsewhere()],
    ];
    for (const [way, said] of ways) expect(installedLine(way)).toBe(said);
    expect(installedLine("teleported" as Standing["installed"])).toBe(
      m.copy_installed_other(),
    );
  });
});
