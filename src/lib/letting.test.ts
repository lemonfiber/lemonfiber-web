import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { bytes } from "./figures";
import {
  candidateLines,
  lettingLines,
  seeding,
  wordOfCandidate,
  type Candidate,
} from "./letting";
import { kept, letGone, letOffer, shared, stray } from "../api/spaces";
import * as m from "../paraglide/messages.js";

describe("a completed download the accounting names", () => {
  it("says what it takes up, where it stands, and what removing it costs", () => {
    expect(candidateLines(shared)).toStrictEqual([
      m.candidate_size({ size: bytes(1_073_741_824) }),
      m.candidate_seeding({ ratio: "1.50" }),
      shared.consequence,
    ]);
    expect(candidateLines(stray)).toStrictEqual([
      m.candidate_size({ size: bytes(524_288_000) }),
      m.candidate_never_imported(),
    ]);
  });

  it("has a word for every standing, and says so of one it has none for", () => {
    expect(wordOfCandidate(kept.standing)).toBe(m.candidate_left_alone());
    const strange = {
      standing: "elsewhere",
    } as unknown as Candidate["standing"];
    expect(wordOfCandidate(strange)).toBe(m.candidate_unrecognised());
  });

  it("is let go only while it is still being shared", () => {
    expect([shared, stray, kept].map(seeding)).toStrictEqual([
      true,
      false,
      false,
    ]);
  });
});

describe("letting one go", () => {
  it("says first what it would cost and what goes with it", () => {
    expect(lettingLines(letOffer)).toStrictEqual([
      m.letting_offered({ name: shared.name }),
      ...candidateLines(shared),
      letOffer.goes,
    ]);
  });

  it("says what the client let go, and that a rehearsal let nothing go", () => {
    expect(lettingLines(letGone)).toStrictEqual([
      m.letting_gone({ name: shared.name, size: bytes(shared.bytes) }),
    ]);
    const rehearsed = {
      ...letOffer,
      gone: { name: shared.name, bytes: shared.bytes, rehearsed: true },
    };
    expect(lettingLines(rehearsed)[0]).toBe(m.came_rehearsed());
  });

  it("carries the same lines in a record", () => {
    expect(linesOf({ kind: "stop-seeding", report: letOffer })).toStrictEqual(
      lettingLines(letOffer),
    );
  });
});
