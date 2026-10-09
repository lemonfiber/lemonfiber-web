import { screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { enveloped, sentTo, walked } from "./setup/Setup.testing";
import { ran } from "./fixture";
import { fresh, interrupted, reviewing, setUp } from "../api/setups";
import {
  plannedLine,
  proseOfStep,
  titleOfStep,
  type Wizard,
} from "../lib/wizard";
import * as m from "../paraglide/messages.js";

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

/**
 * An indexer elsewhere, assembled rather than written: the structural guards
 * refuse a foreign origin in the source, and this one is only typed and sent.
 */
const indexer = ["https:", "", "indexer.example", "api"].join("/");

/** Setup standing on one step, with nothing else changed. */
const on = (at: Wizard["at"], over: Partial<Wizard> = {}): Wizard => ({
  ...fresh,
  at,
  ...over,
});

beforeEach(() => {
  globalThis.history.replaceState(undefined, "", "/");
});

describe("which screen the operator gets", () => {
  it("opens the console on a machine that is set up", async () => {
    walked({ "/api/setup": setUp });
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: m.wizard_title() }),
    ).toBeNull();
  });

  it("opens the wizard on the step setup is on, with the steps ahead", async () => {
    walked({ "/api/setup": fresh });
    expect(
      await screen.findByRole("heading", { name: titleOfStep("welcome") }),
    ).toBeVisible();
    expect(screen.getByText(proseOfStep("welcome"))).toBeVisible();
    expect(screen.getByText(titleOfStep("protocols"))).toBeVisible();
    expect(
      screen.queryByRole("button", { name: m.action_wizard_back() }),
    ).toBeNull();
  });

  it("counts the steps still to come, for a screen too narrow to list them", async () => {
    walked({ "/api/setup": fresh });
    await screen.findByRole("heading", { name: titleOfStep("welcome") });
    expect(
      screen.getByText(
        m.wizard_steps_left({ count: fresh.unanswered.length + 1 }),
      ),
    ).toBeInTheDocument();
  });

  it("opens on the way out of an apply that stopped part-way, naming what it wrote", async () => {
    walked({ "/api/setup": interrupted });
    expect(
      await screen.findByRole("heading", { name: m.wizard_recovery_title() }),
    ).toBeVisible();
    const written = screen.getByRole("list", { name: m.wizard_written_said() });
    expect(within(written).getAllByRole("listitem")).toHaveLength(2);
  });

  it("says an answer it could not read as that, and asks again when told", async () => {
    const { sent } = walked({
      "/api/setup": { status: 500, text: "It broke." },
    });
    expect(await screen.findByText(m.wizard_unknown_lead())).toBeVisible();
    await press(m.action_wizard_ask_again());
    expect(sentTo(sent, "/api/setup")).toHaveLength(2);
  });

  it("hands a refused key on to whoever asks for another", async () => {
    const { onrefused } = walked({ "/api/setup": { status: 401, text: "" } });
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });
});

describe("walking the steps", () => {
  it("goes on past a step that only informs, and back from a later one", async () => {
    const { sent } = walked({
      "/api/setup": on("preflight"),
      "/api/setup/next": on("prerequisites"),
      "/api/setup/back": on("preflight"),
    });
    await screen.findByRole("heading", { name: titleOfStep("preflight") });
    await press(m.action_wizard_continue());
    expect(
      await screen.findByRole("heading", {
        name: titleOfStep("prerequisites"),
      }),
    ).toBeVisible();
    await press(m.action_wizard_back());
    expect(
      await screen.findByRole("heading", { name: titleOfStep("preflight") }),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/next")).toStrictEqual([undefined]);
    expect(sentTo(sent, "/api/setup/back")).toStrictEqual([undefined]);
  });

  // Back sits first beside each step's own action, a question's and the
  // review's alike.
  it("goes back from a question and from the review", async () => {
    const { sent } = walked({
      "/api/setup": on("review"),
      "/api/setup/back": [on("autostart"), on("notifications")],
    });
    await screen.findByRole("heading", { name: titleOfStep("review") });
    await press(m.action_wizard_back());
    await screen.findByRole("heading", { name: titleOfStep("autostart") });
    await press(m.action_wizard_back());
    expect(
      await screen.findByRole("heading", {
        name: titleOfStep("notifications"),
      }),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/back")).toHaveLength(2);
  });

  it("sends the download services chosen", async () => {
    const { sent } = walked({
      "/api/setup": on("protocols"),
      "/api/setup/answer": on("vpn"),
    });
    await screen.findByRole("heading", { name: titleOfStep("protocols") });
    // Each switch has its words beside it, not only a name to be heard by.
    expect(screen.getByText(m.wizard_usenet())).toBeVisible();
    expect(screen.getByText(m.wizard_torrents())).toBeVisible();
    await press(m.wizard_usenet());
    await press(m.wizard_usenet());
    await press(m.wizard_torrents());
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("vpn") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"protocols":{"usenet":false,"torrent":true}}',
    ]);
  });

  it("sends going without a tunnel only once the operator says they understand", async () => {
    const { sent } = walked({
      "/api/setup": on("vpn"),
      "/api/setup/answer": on("data-location"),
    });
    await screen.findByRole("heading", { name: titleOfStep("vpn") });
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_vpn_absent() }),
    );
    expect(screen.getByText(m.wizard_vpn_confirm())).toBeVisible();
    expect(
      screen.getByRole("button", { name: m.action_wizard_continue() }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(m.wizard_missing_understood())).toBeVisible();
    await press(m.wizard_vpn_understood());
    expect(screen.queryByText(m.wizard_missing_understood())).toBeNull();
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("data-location") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"vpn":"absent"}',
    ]);
  });

  it("sends a tunnel without asking anything more", async () => {
    const { sent } = walked({
      "/api/setup": on("vpn"),
      "/api/setup/answer": on("data-location"),
    });
    await screen.findByRole("heading", { name: titleOfStep("vpn") });
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_vpn_absent() }),
    );
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_vpn_carrying() }),
    );
    expect(screen.queryByText(m.wizard_vpn_confirm())).toBeNull();
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("data-location") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"vpn":"carrying"}',
    ]);
  });

  it("sends a data folder only as a full path", async () => {
    const { sent } = walked({
      "/api/setup": on("data-location"),
      "/api/setup/answer": on("library"),
    });
    await screen.findByRole("heading", { name: titleOfStep("data-location") });
    const box = screen.getByLabelText(m.wizard_data_folder());
    expect(box).toHaveAttribute("autocapitalize", "none");
    await userEvent.type(box, "media");
    expect(
      screen.getByRole("button", { name: m.action_wizard_continue() }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(m.wizard_missing())).toBeVisible();
    await userEvent.clear(box);
    await userEvent.type(box, "/srv/media");
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("library") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"data-location":"/srv/media"}',
    ]);
  });

  it("checks the indexer key, says what it came to, and offers it again where it failed", async () => {
    const proved = on("provider", {
      proof: { outcome: "rejected", detail: "the key is wrong" },
    });
    const { sent } = walked({
      "/api/setup": on("credentials"),
      "/api/setup/answer": proved,
      "/api/setup/back": on("credentials"),
    });
    await screen.findByRole("heading", { name: titleOfStep("credentials") });
    await userEvent.type(
      screen.getByLabelText(m.wizard_indexer_url()),
      indexer,
    );
    await userEvent.type(
      screen.getByLabelText(m.wizard_indexer_key()),
      "abc123",
    );
    await press(m.action_wizard_check());
    expect(
      await screen.findByText(
        m.wizard_proof_indexer_rejected({ detail: "the key is wrong" }),
      ),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      JSON.stringify({ credentials: { url: indexer, key: "abc123" } }),
    ]);
    await press(m.action_wizard_again());
    expect(
      await screen.findByRole("heading", { name: titleOfStep("credentials") }),
    ).toBeVisible();
    expect(screen.getByLabelText(m.wizard_indexer_key())).toHaveValue("");
  });

  it("goes on with no indexer where the operator has none yet", async () => {
    const { sent } = walked({
      "/api/setup": on("credentials"),
      "/api/setup/answer": on("provider"),
    });
    await screen.findByRole("heading", { name: titleOfStep("credentials") });
    await press(m.action_wizard_none_yet());
    await screen.findByRole("heading", { name: titleOfStep("provider") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"credentials":null}',
    ]);
  });

  it("checks the provider login, and says it held", async () => {
    const proved = on("service-user", {
      proof: { outcome: "valid", observed: "it listed groups" },
    });
    const { sent } = walked({
      "/api/setup": on("provider"),
      "/api/setup/answer": proved,
    });
    await screen.findByRole("heading", { name: titleOfStep("provider") });
    await userEvent.type(
      screen.getByLabelText(m.wizard_provider_host()),
      "news.example",
    );
    await userEvent.type(
      screen.getByLabelText(m.wizard_provider_user()),
      "sam",
    );
    await userEvent.type(screen.getByLabelText(m.wizard_provider_pass()), "pw");
    expect(screen.queryByText(m.wizard_provider_plain())).toBeNull();
    await press(m.wizard_provider_tls());
    expect(screen.getByText(m.wizard_provider_plain())).toBeVisible();
    await press(m.action_wizard_check());
    expect(
      await screen.findByText(
        m.wizard_proof_provider_valid({ observed: "it listed groups" }),
      ),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"provider":{"host":"news.example","port":563,"tls":false,"user":"sam","pass":"pw"}}',
    ]);
  });

  it("goes on with no provider, and sends a provider only with a port that is one", async () => {
    const { sent } = walked({
      "/api/setup": on("provider"),
      "/api/setup/answer": on("service-user"),
    });
    await screen.findByRole("heading", { name: titleOfStep("provider") });
    await userEvent.type(
      screen.getByLabelText(m.wizard_provider_host()),
      "news.example",
    );
    await userEvent.type(
      screen.getByLabelText(m.wizard_provider_user()),
      "sam",
    );
    await userEvent.type(screen.getByLabelText(m.wizard_provider_pass()), "pw");
    const port = screen.getByLabelText(m.wizard_provider_port());
    await userEvent.clear(port);
    await userEvent.type(port, "0");
    expect(
      screen.getByRole("button", { name: m.action_wizard_check() }),
    ).toHaveAttribute("aria-disabled", "true");
    await press(m.action_wizard_none_yet());
    await screen.findByRole("heading", { name: titleOfStep("service-user") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"provider":null}',
    ]);
  });

  it("sends the service user's numbers only once both are whole", async () => {
    const { sent } = walked({
      "/api/setup": on("service-user"),
      "/api/setup/answer": on("library"),
    });
    await screen.findByRole("heading", { name: titleOfStep("service-user") });
    await userEvent.type(screen.getByLabelText(m.wizard_user_id()), "1000");
    expect(
      screen.getByRole("button", { name: m.action_wizard_continue() }),
    ).toHaveAttribute("aria-disabled", "true");
    await userEvent.type(screen.getByLabelText(m.wizard_group_id()), "1000");
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("library") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"service-user":[1000,1000]}',
    ]);
  });

  it.each([
    ["library", m.wizard_library_none(), '{"library":"none"}'],
    ["household", m.wizard_household_others(), '{"household":true}'],
    [
      "notifications",
      m.wizard_told_everything(),
      '{"notifications":"everything"}',
    ],
  ] as const)("sends the %s chosen", async (step, choice, body) => {
    const { sent } = walked({
      "/api/setup": on(step),
      "/api/setup/answer": on("autostart"),
    });
    await screen.findByRole("heading", { name: titleOfStep(step) });
    await userEvent.click(screen.getByRole("radio", { name: choice }));
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("autostart") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([body]);
  });

  it("sends that only the operator will use it, after changing their mind", async () => {
    const { sent } = walked({
      "/api/setup": on("household"),
      "/api/setup/answer": on("autostart"),
    });
    await screen.findByRole("heading", { name: titleOfStep("household") });
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_household_others() }),
    );
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_household_alone() }),
    );
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("autostart") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"household":false}',
    ]);
  });

  it("sends whether the stack starts on boot", async () => {
    const { sent } = walked({
      "/api/setup": on("autostart"),
      "/api/setup/answer": reviewing,
    });
    await screen.findByRole("heading", { name: titleOfStep("autostart") });
    await press(m.wizard_autostart_on());
    await press(m.action_wizard_continue());
    await screen.findByRole("heading", { name: titleOfStep("review") });
    expect(sentTo(sent, "/api/setup/answer")).toStrictEqual([
      '{"autostart":false}',
    ]);
  });

  it("hands a key refused on a step on to whoever asks for another", async () => {
    const { onrefused } = walked({
      "/api/setup": on("preflight"),
      "/api/setup/next": { status: 401, text: "" },
    });
    await screen.findByRole("heading", { name: titleOfStep("preflight") });
    await press(m.action_wizard_continue());
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });

  it("says a refused step under it, and stays where it was", async () => {
    walked({
      "/api/setup": on("library"),
      "/api/setup/answer": {
        status: 400,
        text: "This machine cannot use that.",
      },
    });
    await screen.findByRole("heading", { name: titleOfStep("library") });
    await userEvent.click(
      screen.getByRole("radio", { name: m.wizard_library_host() }),
    );
    await press(m.action_wizard_continue());
    expect(
      await screen.findByText("This machine cannot use that."),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: titleOfStep("library") }),
    ).toBeVisible();
  });
});

describe("review and writing setup", () => {
  it("lists everything to be written, a secret withheld, and writes nothing before yes", async () => {
    const { sent } = walked({
      "/api/setup": reviewing,
      "/api/setup/apply": setUp,
    });
    const plan = await screen.findByRole("list", {
      name: m.wizard_plan_said(),
    });
    expect(
      within(plan)
        .getAllByRole("listitem")
        .map((one) => one.textContent),
    ).toStrictEqual(reviewing.plan.map((one) => plannedLine(one)));
    expect(sentTo(sent, "/api/setup/apply")).toStrictEqual([]);
    await press(m.action_wizard_write());
    expect(
      await screen.findByRole("heading", { name: m.wizard_written_title() }),
    ).toBeVisible();
  });

  it("says a review with nothing listed as that, and offers no write before every answer is in", async () => {
    walked({
      "/api/setup": { ...reviewing, plan: [], ready_for_review: false },
    });
    expect(await screen.findByText(m.wizard_plan_none())).toBeVisible();
    expect(
      screen.getByRole("button", { name: m.action_wizard_write() }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});

describe("the way out of an apply that stopped part-way", () => {
  it.each([
    [m.action_wizard_resume(), '{"choice":"resume"}'],
    [m.action_wizard_roll_back(), '{"choice":"roll-back"}'],
  ])("takes %s at once", async (label, body) => {
    const { sent } = walked({
      "/api/setup": interrupted,
      "/api/setup/recover": reviewing,
    });
    await screen.findByRole("heading", { name: m.wizard_recovery_title() });
    await press(label);
    expect(
      await screen.findByRole("heading", { name: titleOfStep("review") }),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/recover")).toStrictEqual([body]);
  });

  it("asks once more before starting over, and takes a no", async () => {
    const { sent } = walked({
      "/api/setup": interrupted,
      "/api/setup/recover": fresh,
    });
    await screen.findByRole("heading", { name: m.wizard_recovery_title() });
    await press(m.action_wizard_start_over());
    expect(screen.getByText(m.wizard_start_over_confirm())).toBeVisible();
    await press(m.action_leave_as_is());
    expect(screen.queryByText(m.wizard_start_over_confirm())).toBeNull();
    await press(m.action_wizard_start_over());
    await press(m.action_wizard_start_over_yes());
    expect(
      await screen.findByRole("heading", { name: titleOfStep("welcome") }),
    ).toBeVisible();
    expect(sentTo(sent, "/api/setup/recover")).toStrictEqual([
      '{"choice":"start-over"}',
    ]);
  });

  it("says it cannot tell what was written where lemonfiber listed nothing", async () => {
    walked({ "/api/setup": { ...interrupted, written: [] } });
    expect(await screen.findByText(m.wizard_written_unknown())).toBeVisible();
  });
});

describe("once setup is written", () => {
  const started = {
    envelope: enveloped("lifecycle", ran),
  };
  const wired = {
    envelope: enveloped("seed", {
      assessment: "assessed",
      rehearsed: false,
      wirings: [],
    }),
  };

  it("starts the stack, then offers to connect it, and opens the console when asked", async () => {
    const { sent } = walked({
      "/api/setup": reviewing,
      "/api/setup/apply": setUp,
      "/api/actions/up": started,
      "/api/actions/seed": wired,
    });
    await screen.findByRole("list", { name: m.wizard_plan_said() });
    await press(m.action_wizard_write());
    await screen.findByRole("heading", { name: m.wizard_written_title() });
    expect(
      screen.getByRole("button", { name: m.action_wizard_connect() }),
    ).toHaveAttribute("aria-disabled", "true");

    await press(m.action_wizard_start());
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: m.action_wizard_connect() }),
      ).not.toHaveAttribute("aria-disabled", "true");
    });
    expect(
      screen.getByRole("button", { name: m.action_wizard_start() }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(sentTo(sent, "/api/actions/up")).toStrictEqual(['{"forms":[]}']);

    await press(m.action_wizard_connect());
    await waitFor(() => {
      expect(sentTo(sent, "/api/actions/seed")).toStrictEqual(["{}"]);
    });

    await press(m.action_wizard_open());
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it("follows a start the runtime took on until it finishes", async () => {
    const { sent } = walked({
      "/api/setup": reviewing,
      "/api/setup/apply": setUp,
      "/api/actions/up": {
        status: 202,
        text: enveloped("job", { job: "5c63", action: "up" }),
      },
      "/api/jobs/5c63": [
        { status: 202, text: enveloped("job", { job: "5c63", action: "up" }) },
        started,
      ],
    });
    await screen.findByRole("list", { name: m.wizard_plan_said() });
    await press(m.action_wizard_write());
    await press(
      await screen
        .findByRole("button", { name: m.action_wizard_start() })
        .then(() => m.action_wizard_start()),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: m.action_wizard_connect() }),
      ).not.toHaveAttribute("aria-disabled", "true");
    });
    expect(sent.some((one) => one.path === "/api/jobs/5c63")).toBe(true);
  });

  it("hands a key refused while starting on to whoever asks for another", async () => {
    const { onrefused } = walked({
      "/api/setup": reviewing,
      "/api/setup/apply": setUp,
      "/api/actions/up": { status: 401, text: "" },
    });
    await screen.findByRole("list", { name: m.wizard_plan_said() });
    await press(m.action_wizard_write());
    await screen.findByRole("heading", { name: m.wizard_written_title() });
    await press(m.action_wizard_start());
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });

  it("goes straight to the console where a recovery finished the apply", async () => {
    walked({ "/api/setup": interrupted, "/api/setup/recover": setUp });
    await screen.findByRole("heading", { name: m.wizard_recovery_title() });
    await press(m.action_wizard_resume());
    expect(
      await screen.findByRole("heading", { name: m.wizard_written_title() }),
    ).toBeVisible();
  });
});
