import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import {
  API_VERSION,
  type ByKind,
  type Fetching,
  type Kind,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { applied, everySetting, madeAtOnce, staged } from "../api/configs";
import { inForce } from "../api/qualities";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const job = "0e5c63e1ab7d9f24";

/** One envelope, rendered as an endpoint renders it. */
const enveloped = <K extends Kind>(kind: K, data: ByKind[K]["data"]): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** One reply, as a transport hands it over. */
interface Says {
  readonly status: number;
  readonly body: string;
}

/** The name for work handed to the runtime. */
const started: Says = {
  status: 202,
  body: enveloped("job", { job, action: "config-set" }),
};

/** What was asked of the stack, in the order it was asked. */
interface Asked {
  /** Each action's body, in the order it was posted. */
  readonly posted: string[];
  /** How many times the settings were read. */
  read: number;
}

/**
 * A stack that answers each change with the next of what it was told to, and
 * redeems each name for the next of what it was given — holding at the last.
 */
function stack(
  replies: readonly Says[],
  becoming: readonly Says[],
  asked: Asked,
): Sending {
  let posts = 0;
  let redeemed = 0;
  return (url, init) => {
    const said = (answer: Says) =>
      Promise.resolve({
        ok: answer.status >= 200 && answer.status < 300,
        status: answer.status,
        text: () => Promise.resolve(answer.body),
      });
    const at = url.replace(here, "");
    if (init.method === "POST") {
      asked.posted.push(init.body ?? "");
      const reply = replies[Math.min(posts, replies.length - 1)];
      posts += 1;
      return said(reply ?? started);
    }
    if (at.startsWith("/api/jobs/")) {
      const next = becoming[Math.min(redeemed, becoming.length - 1)];
      redeemed += 1;
      return said(next ?? started);
    }
    if (at.startsWith("/api/config")) {
      asked.read += 1;
      return said({ status: 200, body: enveloped("config", everySetting) });
    }
    if (at.startsWith("/api/quality")) {
      return said({ status: 200, body: enveloped("quality", inForce) });
    }
    return said({ status: 404, body: "" });
  };
}

const opened = (sending: Sending): void => {
  globalThis.history.replaceState(undefined, "", "/settings");
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
};

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.config_asked() });

const fresh = (): Asked => ({ posted: [], read: 0 });

/** Give one setting a new value and ask. */
async function change(setting: string, value: string): Promise<void> {
  const edit = m.action_config_edit({ key: setting });
  await screen.findByText(edit);
  await press(edit);
  const box = screen.getByLabelText(m.config_new_value({ key: setting }));
  await userEvent.clear(box);
  await userEvent.type(box, value);
  await press(m.action_config_change());
}

describe("changing a setting from the settings screen", () => {
  it("makes a change that costs nothing at once, and reads the settings again", async () => {
    const sent = fresh();
    opened(
      stack([{ status: 200, body: enveloped("config", madeAtOnce) }], [], sent),
    );

    await change("port_forwarding", "off");

    expect(sent.posted).toStrictEqual([
      JSON.stringify({ key: "port_forwarding", value: "off" }),
    ]);
    expect(
      await within(asked()).findByText(
        m.came_config_applied({
          key: "port_forwarding",
          from: "on",
          to: "off",
        }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(sent.read).toBe(2);
    });
  });

  it("shows the review of one that costs something, and makes it on the yes", async () => {
    const sent = fresh();
    opened(
      stack(
        [{ status: 200, body: enveloped("config", staged) }, started],
        [{ status: 200, body: enveloped("config", applied) }],
        sent,
      ),
    );

    await change("data_location", "/mnt/media");
    await within(asked()).findByText(
      m.config_review_title({ key: "data_location" }),
    );
    await press(m.config_wait());
    await press(m.action_config_yes({ key: "data_location" }));

    expect(sent.posted).toStrictEqual([
      JSON.stringify({ key: "data_location", value: "/mnt/media" }),
      JSON.stringify({
        key: "data_location",
        value: "/mnt/media",
        confirm: true,
        wait: true,
      }),
    ]);
    expect(
      await within(asked()).findByText(
        m.came_config_applied({
          key: "data_location",
          from: "/srv/media",
          to: "/mnt/media",
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(m.config_review_title({ key: "data_location" })),
    ).toBeNull();
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const unknown = "There is no setting called port_forwarding here.";
    const sent = fresh();
    opened(stack([{ status: 400, body: unknown }], [], sent));

    await change("port_forwarding", "off");

    expect(await within(asked()).findByText(unknown)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
