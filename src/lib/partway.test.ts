import { describe, expect, it } from "vitest";
import { farOf, partOf, shelvedAs, type PartWay } from "./partway";
import * as m from "../paraglide/messages.js";

const film: PartWay = {
  id: "f01",
  medium: "film",
  title: "Arrival",
  year: 2016,
  position: 3000,
  length: 6960,
};

const episode: PartWay = {
  id: "e1",
  medium: "episode",
  title: "Dulcinea",
  position: 600,
};

describe("how far through something a member got", () => {
  it("is a share of its length, where the server knows the length", () => {
    expect(partOf(film)).toBeCloseTo(3000 / 6960);
    expect(partOf(episode)).toBeUndefined();
  });

  // A length of nothing measures nothing, and is read as not known.
  it("is not measured against a length of nothing", () => {
    expect(partOf({ ...film, length: 0 })).toBeUndefined();
  });

  it("says how much is left where the length is known, in whole minutes", () => {
    expect(farOf(film)).toBe(m.member_partway_left({ left: "66 minutes" }));
  });

  it("says nothing is left where they got past its end", () => {
    expect(farOf({ ...film, position: 7000 })).toBe(
      m.member_partway_left({ left: "0 minutes" }),
    );
  });

  it("says how far in they are where the length is not known", () => {
    expect(farOf(episode)).toBe(m.member_partway_in({ far: "10 minutes" }));
  });
});

describe("what opens as a shelf title", () => {
  it("is a film or a series, as the shelf holds it", () => {
    expect(shelvedAs(film)).toStrictEqual({
      id: "f01",
      medium: "film",
      title: "Arrival",
      year: 2016,
    });
    expect(shelvedAs({ ...film, year: null })?.year).toBeNull();
  });

  it("is not an episode, which is no title of its own", () => {
    expect(shelvedAs(episode)).toBeUndefined();
  });
});
