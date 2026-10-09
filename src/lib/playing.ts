/**
 * What the media server is playing now, for the whole house, in lines a reader
 * can carry.
 *
 * Each session names who is watching, what, and on which device, and whether
 * it is paused. A media server that could not be asked is not a quiet house:
 * the reading says so, and what lemonfiber found is passed on as it wrote it.
 *
 * The words around what lemonfiber writes live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What is playing now, and whether the media server could be asked. */
export type Playing = ByKind["playing"]["data"];

/** One session playing something. */
export type Session = Playing["sessions"][number];

/** What one session is playing, named as the media server holds it. */
export function playedOf(session: Session): string {
  const { series, season, episode } = session;
  if (series === undefined || series === null) return session.title;
  if (
    season === undefined ||
    season === null ||
    episode === undefined ||
    episode === null
  ) {
    return m.playing_episode_of({ series, title: session.title });
  }
  return m.playing_episode_numbered({
    series,
    season,
    episode,
    title: session.title,
  });
}

/** What kind of thing a session is playing, in a few words. */
export function wordOfMedium(medium: Session["medium"]): string {
  switch (medium) {
    case "film":
      return m.playing_film();
    case "series":
      return m.playing_series();
    case "episode":
      return m.playing_an_episode();
    case "other":
      return m.playing_other();
    default:
      return m.playing_medium_other();
  }
}

/** One session, in a sentence: who, what kind of thing, where, and whether paused. */
export function sessionLine(session: Session): string {
  const said = {
    member: session.member,
    medium: wordOfMedium(session.medium),
    device: session.device,
  };
  return session.paused ? m.playing_paused(said) : m.playing_watching(said);
}
