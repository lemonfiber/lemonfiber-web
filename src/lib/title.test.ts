import { describe, expect, it } from "vitest";
import {
  episodeOf,
  factsOf,
  genresOf,
  runsOf,
  seasonOf,
  type Episode,
  type Title,
} from "./title";
import * as m from "../paraglide/messages.js";

const film: Title = {
  id: "f01",
  medium: "film",
  title: "Arrival",
  year: 2016,
  minutes: 116,
  certificate: "12",
  genres: ["Drama", "Science Fiction"],
  seasons: [],
};

const episode: Episode = {
  id: "e1",
  medium: "series",
  title: "Dulcinea",
  number: 1,
  minutes: 44,
};

describe("what a title is, at a glance", () => {
  it("says its kind, year, length and certificate", () => {
    expect(factsOf(film)).toBe(
      [m.member_medium_film(), "2016", "116 minutes", "12"].join(" · "),
    );
  });

  // Absent rather than guessed: a fact the server does not know is left out.
  it("leaves out what the server does not know", () => {
    expect(
      factsOf({
        ...film,
        medium: "series",
        year: null,
        minutes: null,
        certificate: null,
      }),
    ).toBe(m.member_medium_series());
  });

  it("names its genres, and none where it is filed under none", () => {
    expect(genresOf(film)).toBe("Drama, Science Fiction");
    expect(genresOf({ ...film, genres: [] })).toBeUndefined();
  });
});

describe("a series' seasons and episodes", () => {
  it("heads a season with its name and how many episodes it holds", () => {
    expect(
      seasonOf({ id: "s1", name: "Season 1", episodes: [episode, episode] }),
    ).toBe(m.member_title_season({ name: "Season 1", count: 2 }));
  });

  it("numbers an episode where it has a number, and names it alone where not", () => {
    expect(episodeOf(episode)).toBe(
      m.member_title_episode({ number: 1, title: "Dulcinea" }),
    );
    expect(episodeOf({ ...episode, number: null })).toBe("Dulcinea");
  });

  it("says how long an episode runs, where the server knows", () => {
    expect(runsOf(episode)).toBe("44 minutes");
    expect(runsOf({ ...episode, minutes: null })).toBeUndefined();
  });
});
