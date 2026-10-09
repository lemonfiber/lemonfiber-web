import { screen, waitFor, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chosenForm, declared, job } from "./fixture";
import { titleOfDoing, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";
import { enveloped } from "./served";
import {
  console_,
  type Sent,
  accepted,
  going,
  acting,
  press,
  choose,
} from "./Console.testing";

describe("asking lemonfiber to do something", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks for what costs nothing without asking about it first", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("up", false));

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  // An argument the action's command has nowhere to put is refused rather than
  // dropped, so a body carrying one is a request that is never carried out.
  it("sends nothing at all for an action whose command takes no argument", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("seed", false));

    expect(sent.bodies).toStrictEqual(["{}"]);
  });

  it("names the forms that were taken up, to the actions that hold them", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("restart", true));

    expect(sent.bodies).toStrictEqual([
      JSON.stringify({ forms: [chosenForm] }),
    ]);
  });

  it("names none of them again once one is put back down", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await choose(chosenForm);
    await press(wordOfDoing("up", false));

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  // The reply names the work and says nothing else about it. What is kept is
  // the record of having asked, which outlives the request the way the work
  // does.
  it("keeps the name the reply gave work the runtime is holding", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });

    await press(wordOfDoing("up", false));

    expect(
      await screen.findByText(titleOfDoing("up", false)),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(job))).toBeInTheDocument();
  });

  it("puts a record away when it is asked to", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));

    await press(m.action_hide_record());

    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
  });
});

describe("asking for something costly", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks what it costs before anything is sent", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));

    expect(await screen.findByText(m.confirm_stop_title())).toBeInTheDocument();
    expect(sent.bodies).toStrictEqual([]);
  });

  // lemonfiber's own command takes no agreement for a teardown, and a field it
  // has nowhere to put is refused rather than dropped. So the question is this
  // screen's to ask and nothing travels with the answer.
  it("sends no agreement with an action whose command carries none", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));
    await press(m.action_stop_everything());

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  it("sends nothing at all when the answer is no", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));
    await press(m.action_leave_running());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(sent.bodies).toStrictEqual([]);
  });

  // A question standing over a set that has since changed is a question about
  // something else, and answering it would send the request nobody asked for.
  it("withdraws the question when what it was about changes", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("down", true));
    await screen.findByText(m.confirm_stop_chosen_title());
    await choose(chosenForm);

    expect(screen.queryByText(m.confirm_stop_chosen_title())).toBeNull();
    expect(sent.bodies).toStrictEqual([]);
  });

  it("asks about what it will actually stop", async () => {
    console_({ sending: acting(accepted) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("down", true));

    expect(
      await screen.findByText(m.confirm_stop_chosen_title()),
    ).toBeInTheDocument();
  });
});

describe("when lemonfiber will not do what was asked", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("says what lemonfiber said, not the status it said it with", async () => {
    const said = "The action `up` needs `forms`, which was not given.";
    console_({ sending: acting({ status: 400, body: said }) });

    await press(wordOfDoing("up", false));

    expect(
      await screen.findByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "The action up needs forms, which was not given.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("forms").tagName).toBe("CODE");
  });

  // A key is minted once a run, so a write refused is a page holding a key
  // from a run that has ended. Forgetting it on the write path is what keeps a
  // button from being the one thing that never asks again.
  it("forgets the key when a write is turned away", async () => {
    const refused = vi.fn();
    console_({
      sending: acting({ status: 403, body: "" }),
      onrefused: refused,
    });

    await press(wordOfDoing("up", false));

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
  });

  it("records work that finished while the request was open", async () => {
    console_({
      sending: acting({
        status: 200,
        body: enveloped("reset", {
          rehearsed: false,
          confirmed: false,
          reverted: [],
          reverted_connections: [],
        }),
      }),
    });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.work_done())).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: m.came_heading() })).getByText(
        m.came_unread(),
      ),
    ).toBeInTheDocument();
  });
});
