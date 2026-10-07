import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { pausingLines } from "./paused";
import { capped, paused, resumed, unreached } from "../api/lines";
import * as m from "../paraglide/messages.js";

const fetching = m.came_pulling_fetching();
const stopped = m.came_pulling_stopped();

describe("what pausing or resuming every download came to", () => {
  it("names each client with what it was doing and what it read back", () => {
    expect(pausingLines(paused)).toStrictEqual([
      m.came_paused_moved({
        client: "qbittorrent",
        was: fetching,
        now: stopped,
      }),
      m.came_paused_unreached({ client: "sabnzbd", said: unreached }),
    ]);
  });

  it("passes lemonfiber's caution about a spent cap on as it is", () => {
    expect(pausingLines(resumed)).toStrictEqual([
      m.came_paused_moved({
        client: "qbittorrent",
        was: stopped,
        now: fetching,
      }),
      capped,
    ]);
  });

  it("says what a client read back where it did not say what it was doing", () => {
    expect(
      pausingLines({
        ...paused,
        clients: [{ client: "qbittorrent", was: null, now: "stopped" }],
      }),
    ).toStrictEqual([
      m.came_paused_now({ client: "qbittorrent", now: stopped }),
    ]);
  });

  // A rehearsal asks nothing, so each client has only what it was doing.
  it("says a rehearsal changed nothing, and what each client is doing", () => {
    expect(
      pausingLines({
        ...paused,
        rehearsed: true,
        clients: [
          { client: "qbittorrent", was: "fetching" },
          { client: "sabnzbd", was: null, now: null, unreached: null },
        ],
      }),
    ).toStrictEqual([
      m.came_rehearsed(),
      m.came_paused_is({ client: "qbittorrent", is: fetching }),
      m.came_paused_unsaid({ client: "sabnzbd" }),
    ]);
  });

  it("says so where the stack runs no download client", () => {
    expect(pausingLines({ ...paused, clients: [] })).toStrictEqual([
      m.came_paused_none(),
    ]);
  });

  it("is what a record of it carries", () => {
    expect(linesOf({ kind: "pausing", report: paused })).toStrictEqual(
      pausingLines(paused),
    );
  });
});
