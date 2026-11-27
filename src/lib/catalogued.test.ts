import { describe, expect, it } from "vitest";
import { cataloguedLines, shownOf, unlistedLine } from "./catalogued";
import {
  coversOffered,
  fetcherOffered,
  listed,
  switchedOff,
  unread,
} from "../api/proofs";
import * as m from "../paraglide/messages.js";

describe("one plugin the catalogue offers", () => {
  it("says what it does, the version reviewed, what of it is here and what is lost without it", () => {
    expect(cataloguedLines(fetcherOffered)).toStrictEqual([
      "Fetches subtitles for everything the library holds.",
      m.plug_catalogue_version({ version: "1.5.0" }),
      m.plug_catalogue_behind({ version: "1.4.0" }),
      m.plug_catalogue_without({
        without: "Nothing has subtitles unless a file carries its own.",
      }),
    ]);
    expect(cataloguedLines(coversOffered)[2]).toBe(m.plug_catalogue_absent());
    expect(cataloguedLines({ ...coversOffered, installed: null })[2]).toBe(
      m.plug_catalogue_absent(),
    );
    expect(
      cataloguedLines({
        ...coversOffered,
        installed: { version: "2.0.0", newer: false },
      })[2],
    ).toBe(m.plug_catalogue_installed({ version: "2.0.0" }));
  });
});

describe("why the catalogue lists nothing", () => {
  it("is nothing where it was read and lists something", () => {
    expect(unlistedLine(listed)).toBeUndefined();
  });

  it("names the setting that switches asking it on, where one holds it off", () => {
    expect(unlistedLine(switchedOff)).toBe(
      m.plug_catalogue_off_setting({
        key: "LEMONFIBER_REACH_CATALOGUE",
        value: "on",
      }),
    );
    expect(unlistedLine({ ...switchedOff, setting: null })).toBe(
      m.plug_catalogue_off(),
    );
  });

  it("is lemonfiber's sentence where the index could not be read", () => {
    expect(unlistedLine(unread)).toBe(
      "The catalogue's index is older than the one already read.",
    );
    expect(unlistedLine({ ...unread, failure: null })).toBe(
      m.plug_catalogue_failed(),
    );
  });

  it("says it lists nothing where it was read and lists nothing", () => {
    expect(unlistedLine({ ...listed, entries: [] })).toBe(
      m.plug_catalogue_empty(),
    );
  });
});

describe("what the catalogue section draws", () => {
  it("lists entries only where the catalogue was read", () => {
    expect(shownOf({ ok: true, value: listed })).toStrictEqual({
      said: undefined,
      entries: listed.entries,
    });
    expect(shownOf({ ok: true, value: unread })).toStrictEqual({
      said: unread.failure?.summary,
      entries: [],
    });
  });

  it("says why it could not be read where the read was turned down", () => {
    expect(
      shownOf({
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      }),
    ).toStrictEqual({ said: "Nothing answered.", entries: [] });
  });
});
