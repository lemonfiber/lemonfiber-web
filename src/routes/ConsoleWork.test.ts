import { screen, waitFor, within } from "@testing-library/svelte";
import type { Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { titleOfDoing, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";
import { enveloped, type Says } from "./served";
import {
  framed,
  saying,
  settle,
  console_,
  type Sent,
  accepted,
  rendered,
  going,
  acting,
  press,
} from "./Console.testing";

/** A wait that is over as soon as it begins, so a test answers at once. */
const atOnce = (): Promise<void> => Promise.resolve();

/** What lemonfiber says about work that ran and stopped. */
const wentWrong = "The container engine is not running.";

/** The work, stopped, as the failure renders it. */
const failed: Says = {
  status: 500,
  body: enveloped("error", {
    code: "engine-absent",
    summary: wentWrong,
    meaning: "Nothing can be started until it is.",
    remedies: [],
    severity: "error",
    state: "actionable",
  }),
};

/** A name this run never handed out. */
const forgotten: Says = {
  status: 404,
  body: "No work in this run goes by that name.",
};

/** The region a question, a record and the wait's own line all sit in. */
const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.running_asked() });

describe("what became of the work", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("says it finished, rather than going on saying it was taken on", async () => {
    console_({ sending: acting(accepted, undefined, [rendered]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(screen.queryByText(m.eyebrow_taken_on())).toBeNull();
  });

  // The envelope a finished job is redeemed for is the outcome, and a record
  // saying only "finished" sends the operator looking for what it already said.
  it("says what it came to, in what lemonfiber reported", async () => {
    console_({ sending: acting(accepted, undefined, [rendered]) });

    await press(wordOfDoing("up", false));

    const came = await screen.findByRole("list", { name: m.came_heading() });
    expect(
      within(came).getByText(m.came_condition_active()),
    ).toBeInTheDocument();
    expect(
      within(came).getByText(m.came_command({ command: "compose up -d" })),
    ).toBeInTheDocument();
  });

  it("says what wiring came to, connection by connection", async () => {
    console_({
      sending: acting(accepted, undefined, [
        {
          status: 200,
          body: enveloped("seed", {
            assessment: "assessed",
            rehearsed: false,
            wirings: [
              {
                connection: "SABnzbd into Sonarr",
                severity: { severity: "informational" },
                state: { state: "wired" },
              },
            ],
          }),
        },
      ]),
    });

    await press(wordOfDoing("seed", false));

    const came = await screen.findByRole("list", { name: m.came_heading() });
    expect(
      within(came).getByText(
        m.came_wiring_wired({ connections: "SABnzbd into Sonarr" }),
      ),
    ).toBeInTheDocument();
  });

  it("says what stopped it, in the words the failure rendered", async () => {
    console_({ sending: acting(accepted, undefined, [failed]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(wentWrong)).toBeInTheDocument();
  });

  // Nothing carries a job across a restart, so answering "still going" for a
  // name nothing knows would leave a reader waiting on an outcome that is
  // never coming.
  it("says a name this run no longer knows is gone, not unfinished", async () => {
    console_({ sending: acting(accepted, undefined, [forgotten]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_forgotten())).toBeInTheDocument();
  });

  // The work may be running perfectly well; it is the asking that stopped.
  it("says it lost the thread when it cannot ask at all", async () => {
    const sending: Sending = (url, init) =>
      url.includes("/api/jobs/")
        ? Promise.reject(new Error("no route"))
        : acting(accepted)(url, init);
    console_({ sending });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_lost_track())).toBeInTheDocument();
  });

  // A record is one request among several, and an outcome that arrived for one
  // of them says nothing about the rest.
  it("leaves the other records where they were", async () => {
    console_({ sending: acting(accepted, undefined, [going, rendered]) });

    await press(wordOfDoing("up", false));
    await press(wordOfDoing("seed", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(screen.getByText(m.eyebrow_taken_on())).toBeInTheDocument();
    expect(screen.getByText(titleOfDoing("up", false))).toBeInTheDocument();
  });

  it("asks again until there is something to say", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({
      sending: acting(accepted, sent, [going, going, rendered]),
      pausing: atOnce,
    });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(sent.redeemed).toHaveLength(3);
  });

  // A record nobody is looking at is not a reason to keep asking lemonfiber
  // anything.
  it("stops asking once the record is put away", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    let go = (): void => undefined;
    const held = (): Promise<void> =>
      new Promise((resolve) => {
        go = () => {
          resolve();
        };
      });
    console_({ sending: acting(accepted, sent, [going]), pausing: held });

    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));
    await press(m.action_hide_record());
    go();
    await settle();

    expect(sent.redeemed).toHaveLength(1);
  });

  it("stops asking once the screen is put away", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    let go = (): void => undefined;
    const held = (): Promise<void> =>
      new Promise((resolve) => {
        go = () => {
          resolve();
        };
      });
    const screening = console_({
      sending: acting(accepted, sent, [going]),
      pausing: held,
    });

    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));
    screening.unmount();
    go();
    await settle();

    expect(sent.redeemed).toHaveLength(1);
  });

  // A key is minted once a run, so an asking refused is a page holding a key
  // from a run that has ended.
  it("forgets the key when the asking is turned away", async () => {
    const refused = vi.fn();
    console_({
      sending: acting(accepted, undefined, [{ status: 403, body: "" }]),
      onrefused: refused,
    });

    await press(wordOfDoing("up", false));

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });
});

describe("what a wait says while it is still waiting", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  const line = "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

  it("draws the newest line the stream carried", async () => {
    console_({ fetching: saying([framed("start", line)]) });

    expect(await screen.findByText(line)).toBeInTheDocument();
    expect(screen.getByText(m.waiting_still())).toBeInTheDocument();
  });

  it("keeps only the newest of them", async () => {
    const older = "Still starting: sonarr, radarr — 5 seconds so far, of 180.";
    console_({
      fetching: saying([framed("start", older), framed("start", line)]),
    });

    expect(await screen.findByText(line)).toBeInTheDocument();
    expect(screen.queryByText(older)).toBeNull();
  });

  it("puts the line away when it is asked to", async () => {
    console_({ fetching: saying([framed("start", line)]) });
    await screen.findByText(line);

    await press(m.action_hide_line());

    expect(screen.queryByText(line)).toBeNull();
  });
});

// A control removed under a reader's own focus drops that focus to the document.
// Nothing is announced there, the next tab starts at the top of the page, and
// the row that answered the press is what they were reaching for. The panel
// silences a control that can do nothing rather than taking it away for exactly
// this reason; these four take their own row with them and cannot be silenced.
describe("where the reader is left when a row goes away", () => {
  const said = "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("stands them in the region the record was in", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));

    await press(m.action_hide_record());

    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when the costly question is answered yes", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("down", false));
    await screen.findByText(m.confirm_stop_title());

    await press(m.action_stop_everything());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when it is answered no", async () => {
    console_({ sending: acting(accepted) });
    await press(wordOfDoing("down", false));
    await screen.findByText(m.confirm_stop_title());

    await press(m.action_leave_running());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when the wait's own line is put away", async () => {
    console_({ fetching: saying([framed("start", said)]) });
    await screen.findByText(said);

    await press(m.action_hide_line());

    expect(screen.queryByText(said)).toBeNull();
    expect(asked()).toHaveFocus();
  });
});
