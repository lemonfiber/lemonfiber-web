import { describe, expect, it } from "vitest";
import {
  droppedLine,
  originLines,
  purposeLines,
  serviceLines,
  wordOfCriticality,
  type Catalogued,
  type Origin,
} from "./catalogue";
import { catalogue, provenance } from "../api/catalogues";
import * as m from "../paraglide/messages.js";

const [jellyfin, bazarr] = catalogue.services as [Catalogued, Catalogued];
const [pinned] = provenance.services as [Origin];
const [ombi, watchtower] = catalogue.removed;

describe("one service the stack holds", () => {
  it("says what it does, what going without it costs, and how much that matters", () => {
    expect(purposeLines(jellyfin)).toStrictEqual([
      jellyfin.describes,
      m.catalogue_without({ cost: jellyfin.without_it }),
      m.catalogue_critical(),
    ]);
  });

  it("says where it comes from: image, tag, digest, licence and project", () => {
    expect(originLines(pinned)).toStrictEqual([
      m.catalogue_image({ image: "jellyfin/jellyfin", pinned: "10.10.3" }),
      m.catalogue_digest({ digest: "sha256:4f1e" }),
      m.catalogue_license({ license: "GPL-2.0-only" }),
      m.catalogue_upstream({ upstream: pinned.upstream }),
    ]);
    expect(originLines({ ...pinned, digest: null })).not.toContain(
      m.catalogue_digest({ digest: "sha256:4f1e" }),
    );
  });

  it("reads both together, and says where the record of origins does not name it", () => {
    expect(serviceLines(jellyfin, provenance)).toStrictEqual([
      ...purposeLines(jellyfin),
      ...originLines(pinned),
    ]);
    expect(serviceLines(bazarr, provenance)).toStrictEqual([
      ...purposeLines(bazarr),
      m.catalogue_origin_unread(),
    ]);
    expect(serviceLines(bazarr, undefined)).toStrictEqual(purposeLines(bazarr));
  });

  it("has a word for how much every service matters", () => {
    const words: readonly [Catalogued["criticality"], string][] = [
      ["core", m.catalogue_core()],
      ["important", m.catalogue_important()],
      ["enhancing", m.catalogue_enhancing()],
      ["optional", m.catalogue_optional()],
    ];
    for (const [criticality, word] of words) {
      expect(wordOfCriticality(criticality)).toBe(word);
    }
    expect(wordOfCriticality("vital" as Catalogued["criticality"])).toBe(
      m.catalogue_criticality_other(),
    );
  });
});

describe("a service the stack dropped", () => {
  it("says when, why, and what took its place where anything did", () => {
    expect(ombi && droppedLine(ombi)).toBe(
      m.catalogue_replaced({
        id: "ombi",
        version: "2026.07",
        reason: "Its requests moved into the household view.",
        by: "jellyseerr",
      }),
    );
    expect(watchtower && droppedLine(watchtower)).toBe(
      m.catalogue_dropped({
        id: "watchtower",
        version: "2026.04",
        reason: "lemonfiber moves the stack itself.",
      }),
    );
  });
});
