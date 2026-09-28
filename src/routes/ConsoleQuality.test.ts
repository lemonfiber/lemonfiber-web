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
import {
  costed,
  fetched,
  inForce,
  reapplied,
  recyclarr,
} from "../api/qualities";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const job = "5c63e1ab7d0e9f24";

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
  body: enveloped("job", { job, action: "x" }),
};

/** What was asked of the stack, in the order it was asked. */
interface Asked {
  /** Each action, by the address it was posted to and what it carried. */
  readonly posted: { readonly at: string; readonly body: string }[];
  /** How many times the quality was read. */
  read: number;
}

/**
 * A stack that answers each action with the next of what it was told to, and
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
      asked.posted.push({ at, body: init.body ?? "" });
      const reply = replies[Math.min(posts, replies.length - 1)];
      posts += 1;
      return said(reply ?? started);
    }
    if (at.startsWith("/api/jobs/")) {
      const next = becoming[Math.min(redeemed, becoming.length - 1)];
      redeemed += 1;
      return said(next ?? started);
    }
    if (at.startsWith("/api/quality")) {
      asked.read += 1;
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
  screen.getByRole("status", { name: m.quality_asked() });

const fresh = (): Asked => ({ posted: [], read: 0 });

describe("the quality, from the settings screen", () => {
  it("reads the choice in force on the way in", async () => {
    const sent = fresh();
    opened(stack([], [], sent));

    expect(
      await screen.findByText(
        m.quality_choice({ scope: "everything", preset: "balanced" }),
      ),
    ).toBeInTheDocument();
    expect(sent.read).toBe(1);
  });

  it("says the edits are lost before the yes, and sends nothing yet", async () => {
    const sent = fresh();
    opened(stack([], [], sent));
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());

    expect(
      within(asked()).getByText(m.confirm_reapply_prose()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([]);
  });

  it("puts it back on a yes, lists what it replaced, and reads the choice again", async () => {
    const sent = fresh();
    opened(
      stack([], [{ status: 200, body: enveloped("quality", reapplied) }], sent),
    );
    await screen.findByText(m.action_reapply());

    await press(m.action_reapply());
    await press(m.action_reapply_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/quality-reapply", body: "{}" },
    ]);
    expect(
      await within(asked()).findByText(
        m.came_quality_overwritten({ path: recyclarr }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(sent.read).toBe(2);
    });
  });

  it("reads what fetching again would cost first, and fetches on a yes under it", async () => {
    const sent = fresh();
    opened(
      stack(
        [{ status: 200, body: enveloped("upgrade", costed) }, started],
        [{ status: 200, body: enveloped("upgrade", fetched) }],
        sent,
      ),
    );
    await screen.findByText(m.action_upgrade_cost());

    await press(m.action_upgrade_cost());
    await within(asked()).findByText(m.quality_cost_title());
    await press(m.action_upgrade_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/quality-upgrade", body: "{}" },
      {
        at: "/api/actions/quality-upgrade",
        body: JSON.stringify({ confirm: true }),
      },
    ]);
    expect(
      await within(asked()).findByText(
        m.came_upgrade_failed({
          kind: "movies",
          detail: "Radarr did not answer.",
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.quality_cost_title())).toBeNull();
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const busy = "The quality config is being written by another run.";
    const sent = fresh();
    opened(stack([{ status: 409, body: busy }], [], sent));
    await screen.findByText(m.action_upgrade_cost());

    await press(m.action_upgrade_cost());

    expect(await within(asked()).findByText(busy)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });

  it("puts a record away when asked, and the leaving withdraws the question", async () => {
    const sent = fresh();
    opened(
      stack([{ status: 200, body: enveloped("upgrade", costed) }], [], sent),
    );
    await screen.findByText(m.action_reapply());
    await press(m.action_reapply());
    await press(m.action_leave_as_is());
    expect(screen.queryByText(m.confirm_reapply_prose())).toBeNull();

    await press(m.action_upgrade_cost());
    await within(asked()).findByText(m.doing_upgrade_title());
    await press(m.action_hide_record());

    expect(within(asked()).queryByText(m.doing_upgrade_title())).toBeNull();
  });
});
