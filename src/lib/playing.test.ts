import { describe, expect, it } from "vitest";
import { playedOf, sessionLine, wordOfMedium, type Session } from "./playing";
import { episode, film } from "../api/playings";
import * as m from "../paraglide/messages.js";

describe("what one session is playing", () => {
  it("is the title of a film as the media server holds it", () => {
    expect(playedOf(film)).toBe("Big Buck Bunny");
  });

  it("names an episode by its series, and by season and number where known", () => {
    expect(playedOf(episode)).toBe(
      m.playing_episode_numbered({
        series: "The Expanse",
        season: 2,
        episode: 5,
        title: "Home",
      }),
    );
    expect(playedOf({ ...episode, season: null })).toBe(
      m.playing_episode_of({ series: "The Expanse", title: "Home" }),
    );
    expect(playedOf({ ...episode, episode: null })).toBe(
      m.playing_episode_of({ series: "The Expanse", title: "Home" }),
    );
  });

  it("says who is watching, what kind of thing, on which device, and whether it is paused", () => {
    expect(sessionLine(film)).toBe(
      m.playing_watching({
        member: "Kit",
        medium: m.playing_film(),
        device: "Living room TV",
      }),
    );
    expect(sessionLine(episode)).toBe(
      m.playing_paused({
        member: "Sam",
        medium: m.playing_series(),
        device: "Sam's phone",
      }),
    );
  });

  it("has words for every kind of thing, and says so of one it has none for", () => {
    expect(wordOfMedium("other")).toBe(m.playing_other());
    expect(wordOfMedium("radio" as Session["medium"])).toBe(
      m.playing_medium_other(),
    );
  });
});
