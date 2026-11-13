import { describe, expect, it } from "vitest";
import {
  captionOfFound,
  foundBy,
  keyOf,
  kindOfFound,
  mayAsk,
  standsOf,
  stateOfFound,
  type FoundTitle,
  type Stands,
} from "./askable";
import * as m from "../paraglide/messages.js";

const dune: FoundTitle = {
  id: "438631",
  kind: "movies",
  title: "Dune",
  year: 2021,
  stands: "askable",
};
const severance: FoundTitle = {
  id: "95396",
  kind: "tv",
  title: "Severance",
  year: 2022,
  stands: "partly-here",
};
const duneTwo: FoundTitle = { ...dune, id: "693134", stands: "on-its-way" };
const arrivalFound: FoundTitle = {
  id: "95396",
  kind: "movies",
  title: "Arrival",
  stands: "here",
};

describe("a title a member's search found", () => {
  it("is told apart by its kind as well as its number", () => {
    expect(keyOf(severance)).not.toBe(keyOf(arrivalFound));
  });

  it("is found again by its key, an id holding a separator kept whole", () => {
    expect(foundBy(keyOf(severance))).toEqual({ id: "95396", kind: "tv" });
    expect(foundBy(keyOf({ ...dune, id: "a/b" }))).toEqual({
      id: "a/b",
      kind: "movies",
    });
  });

  it("says what kind of thing it is", () => {
    expect(kindOfFound(dune)).toBe(m.member_medium_film());
    expect(kindOfFound(severance)).toBe(m.member_medium_series());
  });

  it("says when it came out where that is known, and only its kind where not", () => {
    expect(captionOfFound(dune)).toBe(
      m.member_shelf_caption({ kind: m.member_medium_film(), year: 2021 }),
    );
    expect(captionOfFound(arrivalFound)).toBe(m.member_medium_film());
  });

  it("says where it stands, in the household's words", () => {
    expect(standsOf("here")).toBe(m.found_here());
    expect(standsOf("partly-here")).toBe(m.found_partly_here());
    expect(standsOf("on-its-way")).toBe(m.found_on_its_way());
    expect(standsOf("askable")).toBe(m.found_askable());
    expect(standsOf("elsewhere" as Stands)).toBe(m.found_unrecognised());
  });

  it("is tagged with where it stands, unless it may be asked for", () => {
    expect(stateOfFound("here")).toBe("known");
    expect(stateOfFound("partly-here")).toBe("part");
    expect(stateOfFound("on-its-way")).toBe("quiet");
    expect(stateOfFound("askable")).toBeUndefined();
    expect(stateOfFound("elsewhere" as Stands)).toBeUndefined();
  });

  it("may be asked for where lemonfiber offered it, a series partly here too", () => {
    expect(mayAsk(dune)).toBe(true);
    expect(mayAsk(severance)).toBe(true);
    expect(mayAsk(duneTwo)).toBe(false);
    expect(mayAsk(arrivalFound)).toBe(false);
  });
});
