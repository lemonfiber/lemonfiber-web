import { describe, expect, it } from "vitest";
import { whenOf } from "./history";
import {
  installedLines,
  nameOf,
  sourceLine,
  substitutedLine,
  type Source,
} from "./plugins";
import { bare, plugins, subtitles } from "../api/installs";
import * as m from "../paraglide/messages.js";

const from = "example.org/subtitle-fetch.git";

describe("one installed plugin", () => {
  it("is called what its author calls it, or by its id where nothing names it", () => {
    expect(nameOf(subtitles)).toBe("Subtitle fetch");
    expect(nameOf(bare)).toBe("hand-rolled");
    expect(nameOf({ ...bare, name: "" })).toBe("hand-rolled");
    expect(nameOf({ plugin: "kept", version: "0.1.0", services: [] })).toBe(
      "kept",
    );
  });

  it("says what it does, where it came from, what it runs and fills, and whether its source answers", () => {
    expect(installedLines(subtitles, plugins.sources ?? [])).toStrictEqual([
      "Fetches subtitles for everything the library holds.",
      m.plugin_version({ version: "1.4.0" }),
      m.plugin_from({ from }),
      m.plugin_revision({ revision: "9f2c1e7" }),
      m.plugin_signed({ signed: "lemonfiber catalogue key SHA256:4kQ2" }),
      m.plugin_installed_at({ when: whenOf("1790000000") }),
      m.plugin_places({ services: "subfetch" }),
      m.plugin_fills({ capabilities: "subtitles" }),
      m.plugin_source_reachable({ from }),
    ]);
  });

  it("leaves out what its record does not say, and says it runs and fills nothing", () => {
    expect(installedLines(bare, plugins.sources ?? [])).toStrictEqual([
      m.plugin_version({ version: "0.1.0" }),
      m.plugin_places_nothing(),
      m.plugin_fills_nothing(),
    ]);
  });
});

describe("whether a plugin's source answers", () => {
  const asked = (standing: Source["standing"]): string =>
    sourceLine({ plugin: "subtitle-fetch", from, standing });

  it("says a source that has gone cannot be updated from, and why", () => {
    expect(asked({ standing: "unreachable", why: "It is gone." })).toBe(
      m.plugin_source_unreachable({ from, why: "It is gone." }),
    );
  });

  it("says nobody asked, and why", () => {
    expect(asked({ standing: "unasked", why: "Offline." })).toBe(
      m.plugin_source_unasked({ why: "Offline." }),
    );
  });

  it("has a word for a standing it does not know", () => {
    expect(asked({ standing: "moved" } as unknown as Source["standing"])).toBe(
      m.plugin_source_other({ from }),
    );
  });
});

describe("a capability a plugin fills in place of the stack's own", () => {
  it("names the service, the plugin and the capability", () => {
    expect(
      substitutedLine({
        capability: "subtitles",
        service: "subfetch",
        plugin: "subtitle-fetch",
      }),
    ).toBe(
      m.plugin_substituted({
        capability: "subtitles",
        service: "subfetch",
        plugin: "subtitle-fetch",
      }),
    );
  });
});
