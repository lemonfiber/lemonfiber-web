import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { chosenForm, declared, forms, rehearsed } from "./fixture";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  started,
  times,
  type Asked,
  type Says,
} from "./served";
import {
  forgotten,
  guardKept,
  hosted,
  removed,
  stored,
  surveyed,
} from "../api/removals";
import * as m from "../paraglide/messages.js";

/** Where the overview reads what this machine keeps running. */
const hosting = "/api/hosting";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** One screen, against a stack whose removals answer as it is told. */
function opened(
  path: string,
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", path);
  const sending = stack(
    {
      acting,
      becoming,
      reading: {
        "/api/forms?": { status: 200, body: enveloped("preview", rehearsed) },
        "/api/forms": { status: 200, body: enveloped("forms", forms) },
        [hosting]: { status: 200, body: enveloped("hosting", hosted) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

/** What the work became, stopped short, as the failure renders it. */
const stoppedShort: Says = {
  status: 500,
  body: enveloped("error", {
    code: "permission-denied",
    summary: "The configuration directory could not be removed.",
    meaning: "Nothing under it was touched.",
    remedies: [],
    severity: "error",
    state: "actionable",
  }),
};

describe("keeping a command running, from the overview", () => {
  // Nothing comes back to read first, so the question states what the reading
  // said the command does; the yes sends the forms chosen, and what it came to
  // has the overview read again.
  it("asks first, keeps the guard running over the forms chosen, and reads again", async () => {
    const sent = fresh();
    opened("/", sent, {
      "hosting-install": [
        { status: 200, body: enveloped("hosting", guardKept) },
      ],
    });
    const form = declared.find((one) => one.id === chosenForm);
    const choosing = m.forms_choose({ name: form?.name ?? "" });
    await screen.findByRole("button", { name: choosing });
    await press(choosing);
    await press(m.action_host({ name: "watch" }));
    expect(sent.posted).toStrictEqual([]);
    expect(
      screen.getByText(m.confirm_host_title({ name: "watch" })),
    ).toBeVisible();

    await press(m.action_host_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/hosting-install",
        body: JSON.stringify({ kept: "watch", forms: [chosenForm] }),
      },
    ]);
    const asked = screen.getByRole("status", { name: m.hosting_asked() });
    expect(
      await within(asked).findByText(m.hosting_installed({ name: "watch" })),
    ).toBeInTheDocument();
    expect(times(sent, hosting)).toBe(2);
  });
});

describe("taking lemonfiber off, from the disk screen", () => {
  it("lists what a removal reaches, and removes on a yes naming that listing", async () => {
    const sent = fresh();
    opened(
      "/storage",
      sent,
      {
        uninstall: [
          { status: 200, body: enveloped("uninstall", surveyed) },
          started,
        ],
      },
      [started, { status: 200, body: enveloped("uninstall", removed) }],
    );
    await screen.findByText(m.action_remove_list());

    await userEvent.click(
      screen.getByRole("radio", { name: m.tier_services() }),
    );
    await press(m.action_remove_list());
    await screen.findByRole("region", {
      name: m.remove_plan_title({ tier: m.tier_services() }),
    });
    await press(m.action_remove_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/uninstall",
        body: JSON.stringify({ tier: "services" }),
      },
      {
        at: "/api/actions/uninstall",
        body: JSON.stringify({
          tier: "services",
          confirm: true,
          offer: "services-4f1a",
          wait: false,
        }),
      },
    ]);
    const asked = screen.getByRole("status", { name: m.removal_asked() });
    expect(
      await within(asked).findByText(
        m.remove_credential({ what: "The service keys" }),
      ),
    ).toBeInTheDocument();
  });

  // A listing that moved since it was read is refused by lemonfiber, in its
  // own sentence, and reads as a refusal.
  it("says a refused removal in lemonfiber's words", async () => {
    const moved = "What this removal reaches changed since it was listed.";
    opened("/storage", fresh(), {
      uninstall: [
        { status: 200, body: enveloped("uninstall", surveyed) },
        { status: 409, body: moved },
      ],
    });
    await screen.findByText(m.action_remove_list());

    await press(m.action_remove_list());
    await screen.findByText(m.action_remove_yes());
    await press(m.action_remove_yes());

    const asked = screen.getByRole("status", { name: m.removal_asked() });
    expect(await within(asked).findByText(moved)).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });

  // Work that ran and failed is an obstacle, not a refusal, and says so in
  // the words the failure rendered.
  it("lists what lemonfiber keeps, forgets on a yes, and follows it to where it stopped", async () => {
    const sent = fresh();
    opened(
      "/storage",
      sent,
      {
        forget: [{ status: 200, body: enveloped("stored", stored) }, started],
      },
      [started, stoppedShort],
    );
    await screen.findByText(m.action_forget_list());

    await press(m.action_forget_list());
    await screen.findByText(m.action_forget_yes());
    await press(m.action_forget_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/forget", body: "{}" },
      { at: "/api/actions/forget", body: JSON.stringify({ confirm: true }) },
    ]);
    const asked = screen.getByRole("status", { name: m.removal_asked() });
    expect(
      await within(asked).findByText(
        "The configuration directory could not be removed.",
      ),
    ).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_stopped_short())).toBeVisible();
  });

  it("follows a forget to its end", async () => {
    opened("/storage", fresh(), {
      forget: [
        { status: 200, body: enveloped("stored", stored) },
        { status: 200, body: enveloped("stored", forgotten) },
      ],
    });
    await screen.findByText(m.action_forget_list());

    await press(m.action_forget_list());
    await screen.findByText(m.action_forget_yes());
    await press(m.action_forget_yes());

    const asked = screen.getByRole("status", { name: m.removal_asked() });
    expect(
      await within(asked).findByText(
        m.forget_gone({ at: "/Users/ada/.config/lemonfiber" }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.action_forget_yes())).toBeNull();
  });
});
