import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Requests from "./Requests.svelte";
import { finder } from "./finds";
import { household } from "./house";
import type { Freshness } from "../lib/freshness";
import { stepLine, type Heard, type Step } from "../lib/stepping";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 2 };

/** A walk still going, under the job its accepting reply named. */
const going: Work = {
  id: "71",
  doing: "walkthrough",
  scoped: false,
  given: { item: "Andor" },
  at: "under-way",
  job: "5c63",
};

const searching: Step = {
  step: "searching",
  said: "Asking the indexers.",
  detail: "",
};
const grabbing: Step = {
  step: "grabbing",
  said: "Handing it over.",
  detail: "",
};

/** The requests screen, with a walk going and these steps heard. */
function walking(heard?: Heard): void {
  render(Requests, {
    household: { ok: true, value: household },
    freshness: answered,
    finder: { ...finder, work: [going] },
    walking: heard,
  });
}

describe("a walk still going, on the requests screen", () => {
  it("lists each step the stream says it took, as it takes it", () => {
    walking({ "5c63": [searching, grabbing], "9f2c": [grabbing] });
    const steps = screen.getByRole("list", { name: m.walk_steps_heard() });
    expect(
      within(steps)
        .getAllByRole("listitem")
        .map((one) => one.textContent),
    ).toStrictEqual([stepLine(searching), stepLine(grabbing)]);
  });

  it("lists nothing before a step is heard", () => {
    walking({ "9f2c": [grabbing] });
    expect(
      screen.queryByRole("list", { name: m.walk_steps_heard() }),
    ).toBeNull();
    walking();
    expect(
      screen.queryAllByRole("list", { name: m.walk_steps_heard() }),
    ).toHaveLength(0);
  });

  it("lists no steps under a walk that stopped before it began", () => {
    render(Requests, {
      household: { ok: true, value: household },
      freshness: answered,
      finder: {
        ...finder,
        work: [
          {
            id: "72",
            doing: "walkthrough",
            scoped: false,
            given: {},
            at: "stopped",
            said: "Refused.",
          },
        ],
      },
      walking: { "5c63": [searching] },
    });
    expect(
      screen.queryByRole("list", { name: m.walk_steps_heard() }),
    ).toBeNull();
  });
});
