/**
 * What pausing or resuming every download client came to, in lines a record can
 * carry.
 *
 * Each client is named with what it was doing before it was asked and what it
 * read back afterwards, as lemonfiber reports them. A client that could not be
 * reached says so in its own words rather than reading as paused. A resume that
 * a spent cap will undo the next time the line is checked comes with
 * lemonfiber's caution about it.
 *
 * What lemonfiber writes into the report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What pausing or resuming the download clients came to. */
export type Paused = ByKind["pausing"]["data"];

/** One client's answer in that report. */
type Client = Paused["clients"][number];

/** Whether a client is fetching at all, as it read back. */
type Pulling = NonNullable<Client["now"]>;

/** The word for whether a client is fetching. */
function wordOfPulling(pulling: Pulling): string {
  switch (pulling) {
    case "fetching":
      return m.came_pulling_fetching();
    case "stopped":
      return m.came_pulling_stopped();
  }
}

/** What one client said, in a line. */
function clientLine(one: Client): string {
  const { client, was, now, unreached } = one;
  if (unreached !== undefined && unreached !== null) {
    return m.came_paused_unreached({ client, said: unreached });
  }
  if (now !== undefined && now !== null) {
    return was === undefined || was === null
      ? m.came_paused_now({ client, now: wordOfPulling(now) })
      : m.came_paused_moved({
          client,
          was: wordOfPulling(was),
          now: wordOfPulling(now),
        });
  }
  return was === undefined || was === null
    ? m.came_paused_unsaid({ client })
    : m.came_paused_is({ client, is: wordOfPulling(was) });
}

/** What pausing or resuming came to, line by line. */
export function pausingLines(report: Paused): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  if (report.clients.length === 0) lines.push(m.came_paused_none());
  lines.push(...report.clients.map(clientLine));
  if (report.caution !== undefined && report.caution !== null) {
    lines.push(report.caution);
  }
  return lines;
}
